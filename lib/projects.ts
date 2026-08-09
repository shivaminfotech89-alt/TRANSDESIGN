/**
 * Project repository. Every read and write goes through here so the rest of the
 * app never touches Firestore paths directly.
 *
 * Path layout:
 *   orgs/{orgId}
 *   orgs/{orgId}/members/{uid}
 *   orgs/{orgId}/rateCards/{rateCardId}
 *   orgs/{orgId}/projects/{projectId}
 *   orgs/{orgId}/projects/{projectId}/revisions/{revId}
 *   orgs/{orgId}/projects/{projectId}/documents/{docId}
 */
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_RATES } from "@/packages/engine";
import type {
  Project, ProjectMeta, Revision, RateCard, Rates, DesignSummary,
  EnquiryInput, ProjectStatus, GeneratedDocument, Org,
} from "./types";

const orgRef = (orgId: string) => doc(db, "orgs", orgId);
const projectsRef = (orgId: string) => collection(db, "orgs", orgId, "projects");
const projectRef = (orgId: string, id: string) => doc(db, "orgs", orgId, "projects", id);
const revisionsRef = (orgId: string, id: string) =>
  collection(db, "orgs", orgId, "projects", id, "revisions");
const rateCardsRef = (orgId: string) => collection(db, "orgs", orgId, "rateCards");

const pad = (n: number) => String(n).padStart(3, "0");

/* ---------------- organisations ---------------- */

/**
 * TASKS.md item 3. Two separate writes, not a batch: the member document's
 * create rule reads the org document to check `ownerUid`, and the rules
 * cannot see an org that does not exist yet -- BUILD-GUIDE.md section 7.
 * Then seed a rate card from the engine defaults so pricing has somewhere
 * to come from on day one.
 */
export async function createOrganisation(uid: string, email: string, name: string): Promise<string> {
  const ref = doc(collection(db, "orgs"));
  const orgId = ref.id;

  const org: Org = {
    name, ownerUid: uid, createdAt: Date.now(),
    country: "IN", currency: "INR", memberUids: [uid],
  };
  await setDoc(ref, org);

  await setDoc(doc(db, "orgs", orgId, "members", uid), {
    uid, email, role: "owner", addedAt: Date.now(),
  });

  await saveRateCard(orgId, uid, "default", {
    name: "Standard rates", currency: "INR",
    rates: DEFAULT_RATES, effectiveFrom: Date.now(),
  });

  return orgId;
}

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

export async function listMyOrgs(uid: string): Promise<Array<{ id: string; name: string; role: string }>> {
  // Requires a collection-group index on `members` keyed by uid.
  const snap = await getDocs(query(collection(db, "orgs"), where("memberUids", "array-contains", uid)));
  return snap.docs.map((d) => ({ id: d.id, name: d.data().name as string, role: "member" }));
}

export { orgRef, serverTimestamp };
