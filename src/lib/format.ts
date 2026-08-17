/**
 * Bare (no currency symbol) en-IN grouped rupee formatting, for table cells
 * that show a rate or amount next to a unit column rather than inline in
 * prose -- packages/engine's own inr() covers the prefixed "₹1,23,456"
 * case used everywhere else. Both guard the same way and for the same
 * reason: a BOM row's rate is NaN whenever the rate card it priced against
 * is missing that key (src/lib/pricing.ts's own withRateDefaults() is the
 * actual fix; this is the second, independent guard so a NaN that reaches
 * here anyway renders as an honest "--", not the literal string "NaN"
 * Math.round(NaN).toLocaleString() would otherwise produce.
 */
export function fmtMoney(n: number): string {
  return typeof n === 'number' && isFinite(n) ? Math.round(n).toLocaleString('en-IN') : '--';
}
