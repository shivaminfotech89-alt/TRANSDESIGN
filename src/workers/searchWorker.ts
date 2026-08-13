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
 *   out -> { type: 'done', results, cancelled }
 *   out -> { type: 'error', message }
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
      ctx.postMessage({ type: 'done', results, cancelled });
    } catch (err) {
      ctx.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }
};
