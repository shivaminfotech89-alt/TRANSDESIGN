import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { defineString } from "firebase-functions/params";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { PDFDocument, PDFName, PDFString, PDFRef } from "pdf-lib";
import { db, auth, storage } from "./admin";

/** functions:config / .env -- the deployed SPA's own origin, e.g.
 *  https://tendermaster-ai.web.app. Not something this function can derive
 *  on its own (it has no fixed relationship to the Firebase project id or
 *  the Cloud Function's own URL), and not hardcoded here since which
 *  hosting origin actually serves /report/... is a deployment detail this
 *  package cannot see from the repo alone -- set via
 *  `firebase functions:config:set app.url="https://..."` or the
 *  equivalent .env value before this function is deployed. */
const APP_URL = defineString("APP_URL");

const TOKEN_KEY = "td_report_token";

/** Kept in sync by hand with src/report/PrintReport.tsx's own
 *  REPORT_SECTIONS -- see that file's comment. Order here is the order
 *  pages and bookmarks come out in. */
const REPORT_SECTIONS: Array<{ id: string; title: string }> = [
  { id: "cover", title: "Rating Plate" },
  { id: "calculations", title: "Design Calculation Sheet" },
  { id: "bom", title: "Bill of Materials & Cost" },
  { id: "manufacturing", title: "Manufacturing Schedules" },
  { id: "register", title: "Document Register & Routine Tests" },
  { id: "nameplate", title: "Rating Name Plate" },
];

interface RequestData {
  orgId: string;
  projectId: string;
  rev: number;
}

/** Low-level PDF outline (bookmarks) tree -- pdf-lib has no high-level API
 *  for this, only the primitives (context.obj/register/assign, catalog),
 *  documented in pdf-lib's own issue tracker as the way to do it. Flat, one
 *  level: a bookmark per REPORT_SECTIONS entry, pointing at the first page
 *  of that section as it actually landed after merging -- not a guessed
 *  page number, entries carries the real page index each section's own
 *  page.pdf() capture produced. */
function addOutline(pdfDoc: PDFDocument, entries: Array<{ title: string; pageIndex: number }>) {
  if (entries.length === 0) return;
  const context = pdfDoc.context;
  const outlinesDict = context.obj({ Type: "Outlines", Count: entries.length });
  const outlinesRef = context.register(outlinesDict);
  const itemRefs: PDFRef[] = entries.map(() => context.nextRef());

  entries.forEach((entry, i) => {
    const page = pdfDoc.getPage(entry.pageIndex);
    const dest = context.obj([page.ref, "XYZ", null, null, null]);
    const itemDict = context.obj({
      Title: PDFString.of(entry.title),
      Parent: outlinesRef,
      Dest: dest,
      ...(i > 0 ? { Prev: itemRefs[i - 1] } : {}),
      ...(i < entries.length - 1 ? { Next: itemRefs[i + 1] } : {}),
    });
    context.assign(itemRefs[i], itemDict);
  });

  outlinesDict.set(PDFName.of("First"), itemRefs[0]);
  outlinesDict.set(PDFName.of("Last"), itemRefs[itemRefs.length - 1]);
  pdfDoc.catalog.set(PDFName.of("Outlines"), outlinesRef);
  pdfDoc.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));
}

/**
 * TASKS.md item 10. Puppeteer renders src/report/PrintReport.tsx (the same
 * React app, not a separate template) with a signed Firebase custom token
 * standing in for the calling user's own identity, so the headless render
 * goes through the exact same firestore.rules every interactive session
 * does -- no PDF-specific permission model to keep in sync separately.
 * Bookmarks/page numbers/revision/watermark/QR are split between here and
 * PrintReport.tsx: watermark and QR are rendered INTO the HTML (simplest,
 * no post-processing), page numbers are Puppeteer's own header/footer
 * templates, bookmarks are the one thing that needs PDF-level
 * post-processing (see addOutline above), because Chrome's print-to-PDF
 * does not generate an outline from HTML on its own.
 */
export const generateReportPdf = onCall<RequestData>(
  { timeoutSeconds: 300, memory: "1GiB", cpu: 1 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

    const { orgId, projectId, rev } = request.data || ({} as RequestData);
    if (!orgId || !projectId || typeof rev !== "number") {
      throw new HttpsError("invalid-argument", "orgId, projectId and rev are all required.");
    }

    const memberSnap = await db.doc(`orgs/${orgId}/members/${uid}`).get();
    if (!memberSnap.exists) throw new HttpsError("permission-denied", "Not a member of this organisation.");

    const projectSnap = await db.doc(`orgs/${orgId}/projects/${projectId}`).get();
    if (!projectSnap.exists) throw new HttpsError("not-found", "Project not found.");

    const revId = String(rev).padStart(4, "0");
    const revSnap = await db.doc(`orgs/${orgId}/projects/${projectId}/revisions/${revId}`).get();
    if (!revSnap.exists) throw new HttpsError("not-found", `Revision ${rev} not found.`);

    const customToken = await auth.createCustomToken(uid);
    const appUrl = APP_URL.value();
    if (!appUrl) throw new HttpsError("failed-precondition", "APP_URL is not configured for this function.");

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: { width: 1200, height: 1600 },
    });

    let pdfBytes: Uint8Array;
    let docNo = "";
    let revisionAttr = String(rev);
    try {
      const page = await browser.newPage();
      await page.goto(appUrl, { waitUntil: "domcontentloaded" });
      await page.evaluate(
        (key: string, token: string) => window.sessionStorage.setItem(key, token),
        TOKEN_KEY, customToken,
      );
      const reportUrl = `${appUrl}/report/${orgId}/${projectId}/${rev}`;
      await page.goto(reportUrl, { waitUntil: "networkidle0" });
      await page.waitForSelector('#report-ready[data-ready="true"]', { timeout: 30000 });

      docNo = (await page.$eval("#report-root", (el) => el.getAttribute("data-doc-no"))) || `report-rev${rev}`;
      revisionAttr = (await page.$eval("#report-root", (el) => el.getAttribute("data-revision"))) || revisionAttr;

      const merged = await PDFDocument.create();
      const outlineEntries: Array<{ title: string; pageIndex: number }> = [];

      for (const section of REPORT_SECTIONS) {
        await page.evaluate((id: string) => (window as any).__showSection(id), section.id);
        const buf = await page.pdf({
          format: "A4",
          printBackground: true,
          displayHeaderFooter: true,
          margin: { top: "18mm", bottom: "16mm", left: "14mm", right: "14mm" },
          headerTemplate:
            `<div style="font-size:8px;width:100%;text-align:right;padding:0 14mm;` +
            `color:#78888D;font-family:monospace;">${docNo}</div>`,
          footerTemplate:
            `<div style="font-size:8px;width:100%;text-align:center;color:#78888D;` +
            `font-family:monospace;">Rev ${revisionAttr} &middot; Page ` +
            `<span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
        });
        const src = await PDFDocument.load(buf);
        outlineEntries.push({ title: section.title, pageIndex: merged.getPageCount() });
        const copied = await merged.copyPages(src, src.getPageIndices());
        copied.forEach((p) => merged.addPage(p));
      }
      await page.evaluate(() => (window as any).__showSection(null));

      addOutline(merged, outlineEntries);
      pdfBytes = await merged.save();
    } finally {
      await browser.close();
    }

    const fileName = `${docNo}.pdf`;
    const storagePath = `orgs/${orgId}/projects/${projectId}/${fileName}`;
    await storage.bucket().file(storagePath).save(Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      metadata: { cacheControl: "private, max-age=0, no-transform" },
    });

    const docRef = await db.collection(`orgs/${orgId}/projects/${projectId}/documents`).add({
      docNo,
      title: "Full Design Report",
      reportNo: 0,
      revision: rev,
      status: "generated",
      storagePath,
      generatedBy: uid,
      generatedAt: Date.now(),
    });

    logger.info(`generateReportPdf: ${storagePath} (${pdfBytes.length} bytes), doc ${docRef.id}`);
    return { storagePath, docId: docRef.id, docNo };
  },
);
