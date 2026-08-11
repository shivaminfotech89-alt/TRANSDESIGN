/**
 * Project repository. Every read and write goes through here so the rest of the
 * app never touches Firestore paths directly.
 *
 * Path layout:
 *   orgs/{orgId}
 *   orgs/{orgId}/members/{uid}
 *   orgs/{orgId}/rateCards/{rateCardId}
 *   orgs/{orgId}/suppliers/{supplierId}
 *   orgs/{orgId}/items/{itemId}
 *   orgs/{orgId}/shopNotes/{noteId}
 *   orgs/{orgId}/projects/{projectId}
 *   orgs/{orgId}/projects/{projectId}/revisions/{revId}
 *   orgs/{orgId}/projects/{projectId}/documents/{docId}
 */
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch, arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_RATES } from "@/packages/engine";
import type {
  Project, ProjectMeta, Revision, RateCard, Rates, DesignSummary,
  EnquiryInput, ProjectStatus, GeneratedDocument, Org, Member, Supplier, Item, ShopNote,
} from "./types";

const orgRef = (orgId: string) => doc(db, "orgs", orgId);
const projectsRef = (orgId: string) => collection(db, "orgs", orgId, "projects");
const projectRef = (orgId: string, id: string) => doc(db, "orgs", orgId, "projects", id);
const revisionsRef = (orgId: string, id: string) =>
  collection(db, "orgs", orgId, "projects", id, "revisions");
const rateCardsRef = (orgId: string) => collection(db, "orgs", orgId, "rateCards");
const suppliersRef = (orgId: string) => collection(db, "orgs", orgId, "suppliers");
const itemsRef = (orgId: string) => collection(db, "orgs", orgId, "items");
const shopNotesRef = (orgId: string) => collection(db, "orgs", orgId, "shopNotes");

const pad = (n: number) => String(n).padStart(3, "0");

/* ---------------- organisations ---------------- */

/**
 * TASKS.md item 3. Three separate writes, not a batch, in this order:
 * 1. The org document, so the next write's rule (which reads it back to
 *    check `ownerUid`) has something to see -- rules cannot see an org that
 *    does not exist yet -- BUILD-GUIDE.md section 7.
 * 2. The member document under it.
 * 3. This user's own users/{uid} index, appending the new org. This is the
 *    other half of membership (see lib/types.ts UserIndex) -- without it
 *    listMyOrgs() has no way to find this org again, which is the bug a
 *    memberUids array-contains query on `orgs` was papering over: Firestore
 *    cannot authorise that query against a rule that needs a per-document
 *    exists() check on the members subcollection.
 * Then seed a rate card from the engine defaults so pricing has somewhere
 * to come from on day one.
 */
export async function createOrganisation(uid: string, email: string, name: string): Promise<string> {
  const ref = doc(collection(db, "orgs"));
  const orgId = ref.id;

  const org: Org = {
    name, ownerUid: uid, createdAt: Date.now(),
    country: "IN", currency: "INR",
  };
  await setDoc(ref, org);

  await setDoc(doc(db, "orgs", orgId, "members", uid), {
    uid, email, role: "owner", addedAt: Date.now(),
  });

  await setDoc(
    doc(db, "users", uid),
    { email, updatedAt: Date.now(), orgs: arrayUnion(orgId) },
    { merge: true },
  );

  await saveRateCard(orgId, uid, "default", {
    name: "Standard rates", currency: "INR",
    rates: DEFAULT_RATES, effectiveFrom: Date.now(),
  });

  return orgId;
}

/**
 * One-time repair for an account whose org and members/{uid} documents
 * predate the users/{uid} index (exactly the state this bug left behind):
 * verifies real membership first, so this cannot be used to graft onto an
 * organisation the caller does not already belong to, then writes the
 * missing half.
 */
export async function linkExistingOrg(orgId: string, uid: string, email: string): Promise<void> {
  let memberSnap;
  try {
    memberSnap = await getDoc(doc(db, "orgs", orgId, "members", uid));
  } catch {
    // Firestore does not distinguish "that document does not exist" from
    // "you may not read it" for an unauthorised caller -- both come back as
    // permission-denied, not a clean not-found. Either way it means the
    // same thing here: nothing to link.
    throw new Error(`No membership found for you in organisation "${orgId}". Check the ID and try again.`);
  }
  if (!memberSnap.exists()) {
    throw new Error(`No membership found for you in organisation "${orgId}". Check the ID and try again.`);
  }
  await setDoc(
    doc(db, "users", uid),
    { email, updatedAt: Date.now(), orgs: arrayUnion(orgId) },
    { merge: true },
  );
}

/**
 * No "owner invites a teammate" feature exists in this codebase yet. When one
 * is built, it cannot simply write orgs/{orgId}/members/{uid} for the invitee
 * the way createOrganisation() does for its own uid: firestore.rules lets a
 * user write only their own users/{uid} document, so the inviter can create
 * the members/{uid} doc but cannot also write the invitee's users/{uid} --
 * that write would be denied. The invite flow needs a pending-invite document
 * the invitee accepts by writing their own users/{uid} on first sign-in (the
 * same shape as linkExistingOrg() above). Writing members/{uid} without the
 * invitee ever getting their users/{uid} appended is exactly this bug again.
 */

/* ---------------- projects ---------------- */

export async function listProjects(orgId: string, max = 200): Promise<Project[]> {
  const snap = await getDocs(query(projectsRef(orgId), orderBy("updatedAt", "desc"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Project, "id">) }));
}

export async function searchProjectsByCustomer(orgId: string, customer: string): Promise<Project[]> {
  const snap = await getDocs(query(projectsRef(orgId), where("meta.customer", "==", customer)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Project, "id">) }));
}

export async function getProject(orgId: string, id: string): Promise<Project | null> {
  const s = await getDoc(projectRef(orgId, id));
  return s.exists() ? ({ id: s.id, ...(s.data() as Omit<Project, "id">) }) : null;
}

export async function createProject(
  orgId: string, uid: string, name: string, meta: ProjectMeta
): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(projectsRef(orgId), {
    name, status: "draft" as ProjectStatus, meta,
    currentRevision: -1, summary: null,
    createdBy: uid, createdAt: now, updatedBy: uid, updatedAt: now,
  });
  return ref.id;
}

export async function renameProject(orgId: string, id: string, name: string, uid: string) {
  await updateDoc(projectRef(orgId, id), { name, updatedBy: uid, updatedAt: Date.now() });
}

export async function setProjectStatus(orgId: string, id: string, status: ProjectStatus, uid: string) {
  await updateDoc(projectRef(orgId, id), { status, updatedBy: uid, updatedAt: Date.now() });
}

export async function deleteProject(orgId: string, id: string) {
  // Firestore does not cascade. Delete revisions first, then the parent.
  const revs = await getDocs(revisionsRef(orgId, id));
  const batch = writeBatch(db);
  revs.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(projectRef(orgId, id));
  await batch.commit();
}

/* ---------------- revisions ---------------- */

/**
 * Save a new revision. The summary must come from the engine's `summarise()` so
 * the list view and the design screen can never disagree.
 */
export async function saveRevision(
  orgId: string,
  projectId: string,
  uid: string,
  payload: {
    input: Revision["input"];
    rateCardId: string;
    rateSnapshot: Rates;
    rateSources?: Revision["rateSources"];
    engineVersion: string;
    summary: DesignSummary;
    note?: string;
  }
): Promise<number> {
  const project = await getProject(orgId, projectId);
  const rev = (project?.currentRevision ?? -1) + 1;
  const record: Omit<Revision, "id"> = {
    rev,
    note: payload.note ?? "",
    input: payload.input,
    rateCardId: payload.rateCardId,
    rateSnapshot: payload.rateSnapshot,
    ...(payload.rateSources ? { rateSources: payload.rateSources } : {}),
    engineVersion: payload.engineVersion,
    summary: payload.summary,
    locked: false,
    createdBy: uid,
    createdAt: Date.now(),
  };
  const batch = writeBatch(db);
  batch.set(doc(revisionsRef(orgId, projectId), pad(rev)), record);
  batch.update(projectRef(orgId, projectId), {
    currentRevision: rev,
    summary: payload.summary,
    updatedBy: uid,
    updatedAt: Date.now(),
  });
  await batch.commit();
  return rev;
}

export async function listRevisions(orgId: string, projectId: string): Promise<Revision[]> {
  const snap = await getDocs(query(revisionsRef(orgId, projectId), orderBy("rev", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Revision, "id">) }));
}

export async function getRevision(
  orgId: string, projectId: string, rev: number
): Promise<Revision | null> {
  const s = await getDoc(doc(revisionsRef(orgId, projectId), pad(rev)));
  return s.exists() ? ({ id: s.id, ...(s.data() as Omit<Revision, "id">) }) : null;
}

/** Lock a revision once it has gone to the customer. Rules block edits after this. */
export async function lockRevision(orgId: string, projectId: string, rev: number) {
  await updateDoc(doc(revisionsRef(orgId, projectId), pad(rev)), { locked: true });
}

/** Duplicate a project at its current revision, for a similar enquiry. */
export async function duplicateProject(
  orgId: string, projectId: string, uid: string, newName: string
): Promise<string> {
  const project = await getProject(orgId, projectId);
  if (!project) throw new Error("project not found");
  const latest = await getRevision(orgId, projectId, project.currentRevision);
  const meta: ProjectMeta = { ...project.meta, revision: 0, serial: "" };
  const id = await createProject(orgId, uid, newName, meta);
  if (latest) {
    await saveRevision(orgId, id, uid, {
      input: { ...latest.input, meta },
      rateCardId: latest.rateCardId,
      rateSnapshot: latest.rateSnapshot,
      engineVersion: latest.engineVersion,
      summary: latest.summary,
      note: `Copied from ${project.name} rev ${project.currentRevision}`,
    });
  }
  return id;
}

/* ---------------- rate cards ---------------- */

export async function listRateCards(orgId: string): Promise<Array<RateCard & { id: string }>> {
  const snap = await getDocs(query(rateCardsRef(orgId), orderBy("effectiveFrom", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RateCard) }));
}

export async function getRateCard(orgId: string, id: string): Promise<RateCard | null> {
  const s = await getDoc(doc(rateCardsRef(orgId), id));
  return s.exists() ? (s.data() as RateCard) : null;
}

export async function saveRateCard(
  orgId: string, uid: string, id: string, card: Omit<RateCard, "updatedAt" | "updatedBy">
) {
  await setDoc(doc(rateCardsRef(orgId), id), {
    ...card, updatedBy: uid, updatedAt: Date.now(),
  });
}

/**
 * A fresh id for a new dated rate card version. Rate cards are never edited
 * in place -- effective-from dating means each change is a new document, so
 * a project that already froze a rateSnapshot from an older card keeps
 * reading exactly what it saved, per lib/types.ts's own rule for revisions.
 */
export function newRateCardId(orgId: string): string {
  return doc(rateCardsRef(orgId)).id;
}

/** The rate card actually in force right now: among cards already
 *  effective (effectiveFrom <= now), the most recently dated one --
 *  listRateCards() already sorts effectiveFrom descending, so that is
 *  simply the first one that qualifies. Falls back to the single most
 *  recent card overall if every card is future-dated, so there is always
 *  an active one rather than none. */
export function currentRateCard(cards: Array<RateCard & { id: string }>): (RateCard & { id: string }) | null {
  const now = Date.now();
  return cards.find((c) => c.effectiveFrom <= now) || cards[0] || null;
}

/* ---------------- suppliers ---------------- */

export async function listSuppliers(orgId: string): Promise<Array<Supplier & { id: string }>> {
  const snap = await getDocs(query(suppliersRef(orgId), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Supplier) }));
}

export async function getSupplier(orgId: string, id: string): Promise<Supplier | null> {
  const s = await getDoc(doc(suppliersRef(orgId), id));
  return s.exists() ? (s.data() as Supplier) : null;
}

/**
 * Master data, edited in place -- unlike a rate card, a supplier's contact
 * or lead time changing is not a priced event worth dating and preserving,
 * see lib/types.ts Supplier. Pass an id to update that supplier, or null to
 * create a new one.
 */
export async function saveSupplier(
  orgId: string, uid: string, id: string | null, supplier: Omit<Supplier, "updatedAt" | "updatedBy">
): Promise<string> {
  const record = { ...supplier, updatedBy: uid, updatedAt: Date.now() };
  if (id) {
    await setDoc(doc(suppliersRef(orgId), id), record);
    return id;
  }
  const ref = await addDoc(suppliersRef(orgId), record);
  return ref.id;
}

export async function deleteSupplier(orgId: string, id: string): Promise<void> {
  await deleteDoc(doc(suppliersRef(orgId), id));
}

/* ---------------- item master ---------------- */

export async function listItems(orgId: string): Promise<Array<Item & { id: string }>> {
  const snap = await getDocs(query(itemsRef(orgId), orderBy("code")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Item) }));
}

export async function getItem(orgId: string, id: string): Promise<Item | null> {
  const s = await getDoc(doc(itemsRef(orgId), id));
  return s.exists() ? (s.data() as Item) : null;
}

/**
 * Master data, edited in place, same as a supplier -- price records inside
 * `item.prices` are themselves an append-only history (nothing here deletes
 * an old price), but the item's own code/description/rateKey/preferred
 * supplier are just current facts, not a dated series.
 */
export async function saveItem(
  orgId: string, uid: string, id: string | null, item: Omit<Item, "updatedAt" | "updatedBy">
): Promise<string> {
  const record = { ...item, updatedBy: uid, updatedAt: Date.now() };
  if (id) {
    await setDoc(doc(itemsRef(orgId), id), record);
    return id;
  }
  const ref = await addDoc(itemsRef(orgId), record);
  return ref.id;
}

export async function deleteItem(orgId: string, id: string): Promise<void> {
  await deleteDoc(doc(itemsRef(orgId), id));
}

/* ---------------- shop notes (MANUFACTURING.md section 8) ---------------- */

export async function listShopNotes(orgId: string): Promise<Array<ShopNote & { id: string }>> {
  const snap = await getDocs(query(shopNotesRef(orgId), orderBy("category")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ShopNote) }));
}

/**
 * Standing instructions, edited in place -- see lib/types.ts ShopNote. Pass
 * an id to update that note, or null to create a new one. Never called by
 * the engine or by document generation: MANUFACTURING.md is explicit that
 * these are entered, not generated.
 */
export async function saveShopNote(
  orgId: string, uid: string, id: string | null, note: Omit<ShopNote, "updatedAt" | "updatedBy">
): Promise<string> {
  const record = { ...note, updatedBy: uid, updatedAt: Date.now() };
  if (id) {
    await setDoc(doc(shopNotesRef(orgId), id), record);
    return id;
  }
  const ref = await addDoc(shopNotesRef(orgId), record);
  return ref.id;
}

export async function deleteShopNote(orgId: string, id: string): Promise<void> {
  await deleteDoc(doc(shopNotesRef(orgId), id));
}

/**
 * MANUFACTURING.md section 8's own seven examples, "which show the
 * character of what is wanted" -- not a default library, an illustration
 * to review and prune. Called only from an explicit "Load example notes"
 * action, never automatically on org creation: seeding data an org didn't
 * ask for is not this function's call to make. fromReferenceSheet stays
 * true on every one of these so they stay visibly "came from a sample
 * sheet, not works practice" even after a user edits the wording.
 */
export async function seedShopNotes(orgId: string, uid: string): Promise<void> {
  const examples: Array<Omit<ShopNote, "updatedAt" | "updatedBy">> = [
    { text: "Use only EC grade copper. Very important.", category: "winding", fromReferenceSheet: true },
    { text: "LT covering should not be less than 0.44 to 0.45 mm imported paper.", category: "winding", fromReferenceSheet: true },
    { text: "HT covering should be 0.34 to 0.35 mm TPC imported.", category: "winding", fromReferenceSheet: true },
    { text: "Pie shape phanti should not be less than 75 x 8 mm thick.", category: "core", fromReferenceSheet: true },
    { text: "The core shall be earthed through a tinned copper earthing plate bolted on the core frame channels.", category: "core", fromReferenceSheet: true },
    { text: "MS steel plate on all LV cuts, very important.", category: "winding", fromReferenceSheet: true },
    { text: "Complete stainless steel tie rods to be used.", category: "core", fromReferenceSheet: true },
  ];
  const batch = writeBatch(db);
  for (const note of examples) {
    batch.set(doc(shopNotesRef(orgId)), { ...note, updatedBy: uid, updatedAt: Date.now() });
  }
  await batch.commit();
}

/* ---------------- generated documents ---------------- */

export async function recordDocument(
  orgId: string, projectId: string, d: Omit<GeneratedDocument, "id">
) {
  await addDoc(collection(db, "orgs", orgId, "projects", projectId, "documents"), d);
}

export async function listDocuments(orgId: string, projectId: string): Promise<GeneratedDocument[]> {
  const snap = await getDocs(collection(db, "orgs", orgId, "projects", projectId, "documents"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GeneratedDocument, "id">) }));
}

/* ---------------- membership ---------------- */

export async function getMyRole(orgId: string, uid: string): Promise<string | null> {
  const s = await getDoc(doc(db, "orgs", orgId, "members", uid));
  return s.exists() ? (s.data().role as string) : null;
}

/** For the revisions list: who created each one. Reads the whole members
 *  subcollection once rather than one getDoc per distinct createdBy uid. */
export async function listMembers(orgId: string): Promise<Member[]> {
  const snap = await getDocs(collection(db, "orgs", orgId, "members"));
  return snap.docs.map((d) => d.data() as Member);
}

/**
 * Cannot query `orgs` directly -- see lib/types.ts UserIndex for why a
 * memberUids array-contains query is incompatible with the per-document
 * membership check the org-read rule needs. Reads this user's own index
 * instead, then one getDoc per org it names, both of which the rules permit
 * (your own users/{uid}; orgs you are a member of). A missing users/{uid}
 * document is a legitimate "no organisation yet" result, not an error.
 *
 * A per-org lookup is wrapped so one bad entry -- membership revoked since,
 * or a stale/foreign id -- drops from the list instead of failing the whole
 * sign-in the way one bad row in the old array-contains query never could
 * (it either matched or it did not; this shape can now be inconsistent
 * because the two documents are written separately). Any other failure
 * (users/{uid} itself denied, network) still propagates and is shown.
 */
export async function listMyOrgs(uid: string): Promise<Array<{ id: string; name: string; role: string }>> {
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return [];
  const orgIds = (userSnap.data().orgs as string[] | undefined) ?? [];

  const orgs = await Promise.all(orgIds.map(async (orgId) => {
    try {
      const [orgSnap, role] = await Promise.all([
        getDoc(doc(db, "orgs", orgId)),
        getMyRole(orgId, uid),
      ]);
      if (!orgSnap.exists()) return null;
      return { id: orgId, name: orgSnap.data().name as string, role: role ?? "member" };
    } catch (e) {
      console.warn(`[listMyOrgs] could not read org ${orgId}, dropping it from the list`, e);
      return null;
    }
  }));

  return orgs.filter((o): o is { id: string; name: string; role: string } => o !== null);
}

export { orgRef, serverTimestamp };
