# Building the web app on Firebase

Project: `ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846`

This is the migration path from the single-file design tool to a real
multi-tenant application, with the parts that are already done and the parts
you still have to build.

---

## 1. Read this before anything else

**Check your Firestore rules right now.** A project created from AI Studio or
Firebase Studio usually starts in test mode, which allows any signed-in user —
or in the worst case anyone at all — to read and write every document. Your rate
cards and customer prices would be world-readable. Deploy `firestore.rules` from
this folder before you put a single real quotation in.

The project ID and the API key in the client config are **not** secrets. They
identify the project; they authorise nothing. Security lives entirely in the
rules. What must never appear in client code is a service-account JSON key.

---

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Server components for the heavy report pages, one deploy target |
| Language | TypeScript for the app, JavaScript for the engine | The engine is verified numerically; retyping it invites regressions |
| Auth | Firebase Auth, email link + Google | No password handling |
| Database | Firestore | Already provisioned |
| Files | Cloud Storage | Generated PDFs |
| Server work | Cloud Functions (2nd gen) | PDF rendering, CAD export |
| 3D | three.js with react-three-fiber and drei | The full three build gives you OrbitControls and the GLTF exporter, which the single-file version could not use |
| Hosting | Firebase App Hosting, or Vercel with Firebase as backend | Either works |

---

## 3. Repository layout

```
apps/web/                  Next.js application
  app/
    (auth)/sign-in/
    org/[orgId]/
      projects/            list, search, filter by customer
      projects/[id]/
        design/            the enquiry panel and design sheet
        calculations/
        drawings/
        model/             3D
        costing/
        budget/
        documents/
        revisions/         history and comparison
      settings/
        rates/             rate cards
        members/
        suppliers/
  components/              the UI pulled out of the artifact
  lib/
    firebase.ts            client SDK          (provided)
    types.ts               Firestore shapes    (provided)
    projects.ts            repository layer    (provided)
packages/engine/
  index.js                 the calculation engine  (provided, unchanged)
  engine.test.js           golden-number tests
functions/                 Cloud Functions
  pdf.ts                   Puppeteer report renderer
  cad.ts                   STEP and DXF export
firestore.rules            (provided)
storage.rules              (provided)
firestore.indexes.json     (provided)
```

---

## 4. What is already done in this folder

- **`lib/engine.js`** — the whole calculation engine lifted out of the tool with
  no changes to any formula. It has no React, no Firebase and no DOM. Verified
  standalone: the default 1000 kVA case returns ex-works ₹16,01,393, delivered
  ₹18,89,643, 1146 W no-load, 9910 W load loss, 5.00 % impedance — identical to
  the tool. Entry point is `computeDesign(core, over, rates, extras)`.
- **`lib/types.ts`** — Firestore document shapes.
- **`lib/projects.ts`** — repository: projects, revisions, rate cards,
  documents, membership. Typechecks clean against the Firebase v10 SDK.
- **`firestore.rules`, `storage.rules`, `firestore.indexes.json`.**

---

## 5. Data model, and the rule that keeps prices honest

```
orgs/{orgId}
  members/{uid}                role: owner | engineer | estimator | viewer
  rateCards/{cardId}           copper, CRGO, oil, labour, overhead, margin, GST
  suppliers/{id}               for the supplier comparison report
  items/{id}                   item master, for real BOM part numbers
  projects/{projectId}
    revisions/{000,001,...}    immutable once locked
    documents/{docId}          generated PDFs in Cloud Storage
```

**A revision stores inputs, never outputs.**

It holds the enquiry, the manual overrides, the project metadata, and a frozen
copy of the rate card. It does not hold losses, weights or prices, except a
small `summary` block that exists only so the project list does not have to run
the engine for every row.

Everything on a design screen is recomputed by the engine from
`input` + `rateSnapshot`. This is what stops a saved cheap option from showing
up later against a different design — the class of bug you hit in the tool. If
a number is stored, it can go stale. If it is derived, it cannot.

`engineVersion` is stamped on every revision. Bump `ENGINE_VERSION` whenever you
change a formula, and keep old engine versions importable, so a quotation issued
last year still reprices exactly as it was issued. That is a legal requirement in
most tender conditions, not a nicety.

Locking a revision when the quotation goes out is enforced in the rules: after
`locked: true`, the only permitted write is none.

---

## 6. Firebase console setup

1. **Authentication** → enable Email link and Google.
2. **Firestore** → create the database in `asia-south1` (Mumbai) for Indian
   latency and data residency.
3. **Storage** → create the default bucket.
4. Install the CLI and deploy the rules:

```bash
npm i -g firebase-tools
firebase login
firebase use ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846
firebase deploy --only firestore:rules,firestore:indexes,storage
```

5. `.env.local` in `apps/web`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846.appspot.com
NEXT_PUBLIC_FIREBASE_MSG_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Take the values from Project settings → Your apps → Web app.

---

## 7. First-run sequence for a new company

Because a member document cannot be written before the organisation exists, do
these as two separate writes, not one batch:

```ts
// 1. create the organisation
await setDoc(doc(db, "orgs", orgId), {
  name: "Your company", ownerUid: uid, createdAt: Date.now(),
  country: "IN", currency: "INR", memberUids: [uid],
});
// 2. then your own member document
await setDoc(doc(db, "orgs", orgId, "members", uid), {
  uid, email, role: "owner", addedAt: Date.now(),
});
// 3. seed a rate card from the engine defaults
await saveRateCard(orgId, uid, "default", {
  name: "Standard rates", currency: "INR",
  rates: DEFAULT_RATES, effectiveFrom: Date.now(),
});
```

`memberUids` on the org document is only there so a user can list the
organisations they belong to with one query. The `members` subcollection holds
the role and is what the rules check.

---

## 8. Moving the UI across

The tool is one file with the engine and the UI mixed together. Split it:

1. Copy `lib/engine.js` into `packages/engine/index.js`. Do not edit it.
2. Write `packages/engine/engine.test.js` first, pinning the numbers above as
   golden values. You will change the engine later, and this is what tells you
   whether a change was intended.
3. Move each tab into its own route. The tabs are already independent — every
   one of them reads from `computeDesign()` and writes nothing.
4. Replace the `over` state object with the revision's `input.over`. The
   AUTO/SET behaviour carries across unchanged.
5. Rebuild the 3D tab on react-three-fiber. You get real OrbitControls, GLTF and
   STL export, and instancing for the lamination pockets, all of which the
   single-file version had to work around.

---

## 9. What needs a server

| Feature | Approach |
|---|---|
| PDF report | Cloud Function with Puppeteer. Render the report route with a signed token, print to PDF, write to Storage, record in `documents`. Gives real bookmarks, page numbers, watermark and a QR code. |
| Digital signature | Sign the PDF in the same function with `node-signpdf` and a PKCS#12 certificate held in Secret Manager. |
| STEP / IGES | OpenCascade via `opencascade.js` in a Cloud Run container, or a commercial kernel. Cannot be done in the browser. |
| DXF | `dxf-writer` in a function; the 2D geometry is already parametric so this is a direct port of the SVG drawing code. |
| MRP, supplier comparison | Needs the `items` and `suppliers` collections populated first. The reports are easy; the master data is the work. |
| Audit log | Firestore trigger on writes to `projects/**`, appending to an append-only `auditLogs` collection with `allow update, delete: if false`. |

---

## 10. Order of work

1. Deploy the rules. Verify with the Rules Playground that a non-member is denied.
2. Auth, organisation creation, member invitation.
3. Rate cards. Everything downstream prices off these.
4. Projects list, create, open — using `lib/projects.ts` as-is.
5. Port the design tab and the calculations tab. At this point the app is
   already more useful than the tool, because the work is saved and shared.
6. Costing and budget tabs.
7. Drawings, then 3D.
8. PDF function.
9. Item master and supplier master, then the reports that depend on them.

Do not start at 3D. It is the most visible piece and the least load-bearing.

---

## 11. Cost

Firestore free tier covers a small team comfortably. The two things that will
actually cost money are Cloud Functions with Puppeteer (allocate 1 GB memory,
expect a few seconds per report) and Cloud Storage for accumulated PDFs. Set a
budget alert on the project before you invite anyone.
