/**
 * TASKS.md item 11.4: the price source hierarchy. Pure and Firestore-free,
 * same as everything else under src/lib -- App.tsx supplies the already-
 * fetched items/suppliers/priceLocks, this only decides what to do with
 * them. The engine itself never sees any of this: it still only ever takes
 * a flat Record<string, number> of rates, exactly as it always has
 * (CLAUDE.md invariant 1, the engine has zero imports and zero awareness of
 * where a rate came from). Resolving the hierarchy happens here, in the app
 * layer, before computeDesign() is ever called -- the engine's purity is
 * not something this phase gets to compromise for the sake of a feature.
 *
 * Priority, highest first: a price locked for this project only, then the
 * org's company-designated preferred supplier for that item, then the most
 * recent *approved* price from any supplier, then the rate card's own
 * figure (the pre-11.3 "engineering default" -- an estimate, never
 * presented as a supplier's commitment).
 */
import type { Item, ItemPrice, PriceSourceTier, PriceResolution } from '../../lib/types';

export type { PriceResolution };

export const PRICE_SOURCE_LABELS: Record<PriceSourceTier, string> = {
  'project-locked': 'Project-Locked',
  'company-supplier': 'Company Supplier',
  'latest-approved-supplier': 'Approved Supplier',
  'engineering-default': 'Engineering Default',
};

const isActive = (p: ItemPrice, now: number): boolean =>
  p.effectiveFrom <= now && (p.expiresAt == null || p.expiresAt >= now);

/**
 * Discount is a real negotiated reduction in what is owed per unit, so it
 * belongs in the figure that prices the BOM. GST is not: the rate card's
 * own gstPct already applies it once, at the overall ex-works total
 * (packages/engine buildBOM) -- folding a supplier invoice's GST into a
 * per-kg material rate here would charge it twice. Freight is a lump sum
 * tied to a specific order's quantity, which the item master does not
 * know, so it stays a figure to show and audit, never guessed into a
 * per-unit addition.
 */
const landedUnitPrice = (p: ItemPrice): number => p.unitPrice * (1 - p.discountPct / 100);

/** Every price record for `item` from `supplierId`, most recent first. */
function pricesFrom(item: Item, supplierId: string, now: number): ItemPrice[] {
  return item.prices
    .filter((p) => p.supplierId === supplierId && isActive(p, now))
    .sort((a, b) => b.effectiveFrom - a.effectiveFrom);
}

export function resolveItemPrice(
  item: Item,
  suppliersById: Map<string, { name: string }>,
  now: number,
  projectLock?: number,
): PriceResolution | null {
  if (projectLock != null) {
    return { tier: 'project-locked', value: projectLock };
  }

  if (item.preferredSupplierId) {
    const [active] = pricesFrom(item, item.preferredSupplierId, now);
    if (active) {
      const name = suppliersById.get(active.supplierId)?.name;
      return {
        tier: 'company-supplier', value: landedUnitPrice(active),
        supplierId: active.supplierId, ...(name ? { supplierName: name } : {}),
        date: active.effectiveFrom,
      };
    }
  }

  const [approved] = item.prices
    .filter((p) => p.approved && isActive(p, now))
    .sort((a, b) => b.effectiveFrom - a.effectiveFrom);
  if (approved) {
    const name = suppliersById.get(approved.supplierId)?.name;
    return {
      tier: 'latest-approved-supplier', value: landedUnitPrice(approved),
      supplierId: approved.supplierId, ...(name ? { supplierName: name } : {}),
      date: approved.effectiveFrom,
    };
  }

  return null; // caller falls back to the engineering default -- the rate card's own value.
}

/**
 * Overlays resolved item/supplier prices onto a rate card's own values.
 * Every one of `baseRates`'s keys gets a source (engineering-default at
 * minimum, from the rate card itself); a key with no matching item, or
 * whose item resolves to nothing, keeps its rate-card figure unchanged.
 */
export function resolveRates(
  baseRates: Record<string, number>,
  items: Item[],
  suppliersById: Map<string, { name: string }>,
  priceLocks: Record<string, number>,
  now: number,
): { rates: Record<string, number>; sources: Record<string, PriceResolution> } {
  const rates = { ...baseRates };
  const sources: Record<string, PriceResolution> = {};
  for (const key of Object.keys(baseRates)) {
    sources[key] = { tier: 'engineering-default', value: baseRates[key] };
  }

  for (const item of items) {
    if (!item.rateKey || !(item.rateKey in rates)) continue;
    const resolved = resolveItemPrice(item, suppliersById, now, priceLocks[item.rateKey]);
    if (resolved) {
      rates[item.rateKey] = resolved.value;
      sources[item.rateKey] = resolved;
    }
  }

  return { rates, sources };
}
