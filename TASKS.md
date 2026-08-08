# Build order

Work top to bottom. Each task lists what "done" means. Do not start the 3D tab
early: it is the most visible piece and the least load-bearing.

## 0. Reconcile with what already exists
- Read every file under the repository root and summarise what is present.
- Report which parts of `CLAUDE.md` the current code already satisfies, which
  contradict it, and which are missing. Do not change anything yet.
- Propose a migration plan and wait for approval.

## 1. Secure the database
- Deploy `firestore.rules`, `storage.rules`, `firestore.indexes.json`.
- Verify in the Firebase Rules Playground that a non-member is denied read on
  `orgs/{orgId}/projects/{id}`.
- **Done when** test-mode rules are gone.

## 2. Engine as a package
- Move `engine.js` to `packages/engine/index.js`. Do not edit any formula.
- Wire `npm run test:engine`. All golden numbers pass.
- **Done when** the engine has zero imports and the tests are green.

## 3. Auth and organisations
- Firebase Auth: email link and Google.
- Create an organisation, write the owner's member document as a *second* write
  (the rules cannot see an org that does not exist yet).
- Seed a rate card from `DEFAULT_RATES`.
- **Done when** two accounts in different organisations cannot see each other's
  projects.

## 4. Rate cards
- CRUD over `orgs/{orgId}/rateCards`. Effective-from dating. Everything
  downstream prices off the selected card.
- **Done when** changing a rate changes every open price on screen.

## 5. Projects and revisions
- List with customer, rating, ex-works, delivered, losses, updated.
- Create, open, duplicate, delete. Save a revision. Lock a revision.
- Opening a project clears any budget preview.
- **Done when** reopening a saved project shows that project's own price, never
  a previously selected budget option.

## 6. Design and calculation tabs
- Port the enquiry panel with AUTO/SET overrides, ranges and suggestions.
- Port the design sheet, compliance block and the 68-step calculation sheet.
- **Done when** the golden case renders the numbers in `CLAUDE.md` exactly.

## 7. Costing and budget
- Editable BOM, live material rates, build-up to selling price.
- Budget band with min and max, results split into same-material and
  alternative-material, plus the cheapest design per material.
- **Done when** a previewed option is reflected in every tab with a banner.

## 8. Drawings
- Ten parametric SVG drawings and the dimension, cutting and BOM schedules.
- **Done when** the stamping schedule mass agrees with the engine core mass to
  within 3 % (it will not be exact: the schedule integrates real mitred
  trapezoids, the loss calculation uses mean lengths).

## 9. 3D model
- Rebuild on react-three-fiber and drei. Real OrbitControls, instanced
  lamination pockets, GLTF and STL export.
- Show/hide by group, transparency, exploded view, section plane, click to
  inspect a part.
- **Done when** changing the flux density visibly rebuilds the core.

## 10. PDF via Cloud Function
- Puppeteer renders the report route with a signed token, writes to Storage,
  records in `documents`.
- Bookmarks, page numbers, revision, watermark, QR code.
- **Done when** a ten-page report downloads with a document number on every page.

## 11. Master data, then the reports that need it
- `items` and `suppliers` collections.
- Then MRP, supplier comparison, landed cost.
- **Done when** the document register moves those rows from "Needs input" to
  "Generated" *because the data exists*, not because the status was edited.

## Not in scope for the browser
STEP and IGES need a CAD kernel (OpenCascade on Cloud Run). Type test and FAT
certificates record measured results and can only be templated. Clause-by-clause
compliance needs the licensed standard text.
