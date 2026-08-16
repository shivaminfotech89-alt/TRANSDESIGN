import { computeDesign } from '@/packages/engine';

/**
 * Runs the full computeDesign() -- fitEtkToCost's K-plateau search
 * (CALIBRATION.md section 49) and resolveDiscreteNeighbourhood's density
 * resolution (section 51) -- off the main thread. Together these now cost
 * several seconds per call; App.tsx's own fast path covers every slider
 * tick with a cheap, structurally-frozen computeDesign call on the main
 * thread, and only asks this worker to settle once input stops changing,
 * so this multi-second cost can never block a drag or freeze the tab.
 *
 * Message protocol, same shape as searchWorker.ts:
 *   in  -> { type: 'compute', core, over, rates, extras }
 *   out -> { type: 'done', result }
 *   out -> { type: 'error', message }
 */

const ctx = self as unknown as { postMessage: (msg: unknown) => void; onmessage: ((e: MessageEvent) => void) | null };

ctx.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (!msg || msg.type !== 'compute') return;
  try {
    const result = computeDesign(msg.core, msg.over, msg.rates, msg.extras || []);
    ctx.postMessage({ type: 'done', result });
  } catch (err) {
    ctx.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
