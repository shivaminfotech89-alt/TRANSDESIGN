import { stagedSearchDesigns } from '@/packages/engine';

/**
 * CALIBRATION.md section 25: the Fit to Budget search runs entirely here,
 * off the tab's own main thread, so a large grid can never freeze the UI
 * regardless of how many candidates it ends up evaluating -- staging
 * (packages/engine's stagedSearchDesigns) cut the typical case from
 * 30-plus minutes to under 90 seconds, but "typical" is not "every case",
 * and a synchronous multi-minute run on the main thread was the actual bug
 * report, not just a slow one. This file has no UI framework import, only
 * the pure engine -- it is a message relay, not a second place the search
 * logic lives.
 *
 * Message protocol (postMessage/onmessage, not addEventListener's fuller
 * form -- a dedicated worker only ever has one listener, and this project's
 * tsconfig has no "webworker" lib entry to type DedicatedWorkerGlobalScope
 * against without conflicting with the DOM lib the rest of the app needs,
 * so the worker-global calls below are intentionally loosely typed rather
 * than fought into a stricter shape that would need a second tsconfig):
 *   in  -> { type: 'search', base, rates, band, opts }
 *   in  -> { type: 'cancel' }
 *   out -> { type: 'progress', info }        (stage/phase/count, see engine)
 *   out -> { type: 'done', results, cancelled, excludedNote, pinnedNote }
 *   out -> { type: 'error', message }
 *
 * excludedNote (CALIBRATION.md section 33): stagedSearchDesigns attaches
 * this directly to the results array it returns (packages/engine/index.js)
 * when a conductor was left out of the sweep for an unsourced rate --
 * pulled off here into its own field so BudgetTab does not have to read a
 * non-indexed property off an array that has already crossed postMessage's
 * structured clone.
 *
 * pinnedNote (CALIBRATION.md section 42): same mechanism, set when
 * msg.opts.over pins flux or current density -- every candidate the search
 * evaluated held that pin rather than refitting around it, and this says so.
 */

let cancelled = false;

const ctx = self as unknown as { postMessage: (msg: unknown) => void; onmessage: ((e: MessageEvent) => void) | null };

ctx.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (!msg) return;

  if (msg.type === 'cancel') {
    cancelled = true;
    return;
  }

  if (msg.type === 'search') {
    cancelled = false;
    try {
      const results = stagedSearchDesigns(
        msg.base, msg.rates, msg.band, msg.opts,
        (info: unknown) => ctx.postMessage({ type: 'progress', info }),
        () => cancelled,
      );
      const excludedNote = (results as unknown as { excludedNote?: string }).excludedNote ?? null;
      const pinnedNote = (results as unknown as { pinnedNote?: string }).pinnedNote ?? null;
      ctx.postMessage({ type: 'done', results, cancelled, excludedNote, pinnedNote });
    } catch (err) {
      ctx.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }
};
