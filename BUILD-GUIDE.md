# Building the web app on Firebase

Firebase project: `tendermaster-ai`. This app's data lives in the named
Firestore database `ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846`
— it is not the project's default database. `tendermaster-ai` also hosts
unrelated named databases for other apps on the same account, so every
`firebase` CLI command below must pin this database explicitly (via
`firebase.json`'s `firestore.database` field, or `--database` where the
command supports it) or it will silently target the wrong database.

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
users/{uid}                    orgs: [orgId, ...] -- the other half of membership, see below
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
firebase use tendermaster-ai
# firebase.json must set firestore.database to
# ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846 — this
# project has other named databases, and an unpinned deploy targets the
# project's default database, not this one.
firebase deploy --only firestore:rules,firestore:indexes,storage
```

5. `.env.local` at the repo root (this is a Vite app, `src/`, not the
   Next.js `apps/web` layout an earlier plan called for — see `.env.example`
   for the current, correct list):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846
VITE_FIREBASE_STORAGE_BUCKET=ai-studio-transdesignengin-41442703-2634-4bab-af2b-b96345bc6846.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Take the values from Project settings → Your apps → Web app.

**Vercel specifically:** Vite inlines every `VITE_*` value into the built
JS bundle at build time — it does not read them at runtime the way a
server framework would. `.env.local` is gitignored and never reaches
Vercel's build environment, so these six variables must be entered directly
in the Vercel project's own Settings → Environment Variables, for every
environment (Production, Preview, Development) the app is expected to run
in. A build that succeeds with these unset is not evidence they are
configured correctly — Vite does not require them to complete a build, it
just bakes in `undefined`, and the app fails at runtime in the browser
(Firebase initialising with an incomplete config) rather than at build
time. Re-deploy after adding or changing any of them; Vercel does not
retroactively rebuild an existing deployment when project settings change.

---

## 7. First-run sequence for a new company

Because a member document cannot be written before the organisation exists, do
these as three separate writes, not one batch:

```ts
// 1. create the organisation
await setDoc(doc(db, "orgs", orgId), {
  name: "Your company", ownerUid: uid, createdAt: Date.now(),
  country: "IN", currency: "INR",
});
// 2. then your own member document
await setDoc(doc(db, "orgs", orgId, "members", uid), {
  uid, email, role: "owner", addedAt: Date.now(),
});
// 3. then your own half of the index, so listMyOrgs() can find this org again
await setDoc(doc(db, "users", uid), {
  email, updatedAt: Date.now(), orgs: arrayUnion(orgId),
}, { merge: true });
// 4. seed a rate card from the engine defaults
await saveRateCard(orgId, uid, "default", {
  name: "Standard rates", currency: "INR",
  rates: DEFAULT_RATES, effectiveFrom: Date.now(),
});
```

An earlier version of this guide had `memberUids` on the org document so a
user could list their organisations with a single `array-contains` query
against the `orgs` collection. That does not work: the org-read rule
(`allow read: if member(orgId)`) requires a per-document `exists()` check
against the `members` subcollection, and Firestore cannot authorise a
collection query against a rule shaped like that. `users/{uid}` (step 3
above) replaces it: `listMyOrgs()` reads your own index, then does one
`getDoc()` per org it names, both of which the rules permit outright (your
own `users/{uid}`; an org you are a member of). Skipping step 3 is exactly
the bug that made an organisation invisible to its own owner: the org and
member documents existed, but nothing pointed back to them.

**Ownership, and who can add whom.** `orgs/{orgId}.ownerUid` can only ever be
set to the uid creating the document (`allow create: if ... ownerUid ==
request.auth.uid`) — you cannot create an organisation and name someone
else its owner. Day-to-day authorisation, though, runs entirely off the
`members/{uid}.role` field via `isOwner()`/`canEdit()`, not off `ownerUid`;
an owner can promote another member to `role: "owner"` later, which is the
closest thing to an ownership transfer these rules support; the app does
not currently expose that as a feature, and `ownerUid` itself is never
revised after creation.

Adding a member is two writes that two different people must make, and
that is a rule, not an oversight: the existing owner can write the new
member's `orgs/{orgId}/members/{uid}` document (`allow create: if ...
isOwner(orgId)`), but `users/{uid}` can only be written by
`request.auth.uid == uid` (see firestore.rules) — an owner cannot also
write the invitee's half. Writing only the member document is exactly this
bug again, just for a second person instead of the first: the invitee has
a real membership and still cannot find the organisation. A working invite
flow needs a pending-invite document the invitee accepts by writing their
own `users/{uid}` on first sign-in (the same shape as `linkExistingOrg()`
in `lib/projects.ts`) — nothing in this codebase implements that yet.

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

---

## 12. Deploying the PDF pipeline (item 10, built)

The actual layout ended up `functions/` and `src/report/` at the repository
root, not `apps/web/` — sections 1-11 above describe the original Next.js
migration plan; this section describes what was actually built and how to
put it live. `functions/` is its own npm package (`functions/package.json`),
separate from the root one.

**Before starting:** the Firebase project must be on the Blaze (pay-as-you-go)
plan. Cloud Functions 2nd gen — what `syncOrgClaims` and `generateReportPdf`
both are — will not deploy on the free Spark plan. Firebase Console → Project
Settings → Usage and billing.

Run every `firebase` command from the repository root (`.firebaserc` already
points at `tendermaster-ai`, so plain `firebase deploy` targets the right
project without `firebase use` first).

### Step 1 — install the functions package's own dependencies

```bash
cd functions
npm install
cd ..
```

### Step 2 — set APP_URL

`generateReportPdf` needs to know where the built SPA is actually served, so
Puppeteer has somewhere to navigate to — this cannot be derived from the
Firebase project id or the function's own URL, it depends on how you deploy
hosting, which is outside what this repository controls. Find it the same
way you'd open the app yourself: whatever origin (scheme + host, no path, no
trailing slash) you type into a browser to reach it today — check Firebase
Console → Hosting or → App Hosting, whichever this project actually uses, if
you are not sure.

```bash
cp functions/.env.example functions/.env
```

Edit `functions/.env` and set `APP_URL` to that origin, e.g.
`APP_URL=https://tendermaster-ai.web.app`.

### Step 3 — deploy the two Cloud Functions

```bash
firebase deploy --only functions
```

This builds `functions/` automatically (the `predeploy` hook in
`firebase.json`) and deploys both `syncOrgClaims` and `generateReportPdf` --
everything `functions/src/index.ts` exports. If this fails with a billing
error, that is step zero not being done yet, not a bug.

**Verify:** Firebase Console → Functions — both `syncOrgClaims` and
`generateReportPdf` show a green "Deployed" status. Or:

```bash
firebase functions:log --only syncOrgClaims
```

should run without an error about the function not existing.

### Step 4 — backfill custom claims for every existing member

`syncOrgClaims` only fires on a write to a membership document from now on --
every member added before this deploy has no claim yet, and storage.rules
(step 5) will deny them a read they are actually entitled to until this runs.

Get credentials for a script running outside the Functions environment:
Firebase Console → Project Settings (gear icon) → Service Accounts →
Generate new private key. Save the downloaded file as
`functions/service-account.json` — already in `functions/.gitignore`, never
commit it.

```powershell
cd functions
$env:GOOGLE_APPLICATION_CREDENTIALS = "./service-account.json"
npm run backfill-claims
```

(bash/zsh: `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run backfill-claims`)

This prints one line per member, "set" or "ok, already correct", then a
summary count. **Verify by running the exact same command a second time** --
the summary should now read `0 changed`. If it does not, something is still
writing claims that do not match what's in Firestore; do not proceed to step
5 until a repeat run is a true no-op.

### Step 5 — deploy the new storage.rules

```bash
firebase deploy --only storage
```

Only after step 4 confirms every existing member has a claim — deploying
this first would deny reads to everyone until the backfill catches up.

**Verify:** Firebase Console → Storage → Rules tab shows the deployed rule
reading `request.auth.token.orgs[orgId]`, not the old
`firestore.exists(/databases/(default)/...)`.

### Step 6 — test the round trip

Sign out of the app and back in first — an already-open session's ID token
was minted before its custom claim existed and will not show it until
refreshed, which a normal sign-in does. Then: open a project, save a
revision if none exists yet, Reports & Docs tab, Generate PDF, wait, then
Download. `functions:log --only generateReportPdf` shows the render if
anything needs debugging.
