/**
 * Firestore document shapes.
 *
 * Rule that keeps prices honest: a revision stores INPUTS and a snapshot of the
 * rate card. It never stores computed losses, weights or prices except in
 * `summary`, which exists only so list screens do not have to run the engine.
 * Anything shown on a design screen is recomputed from `input` + `rateSnapshot`.
 */

export type Role = "owner" | "engineer" | "estimator" | "viewer";

export interface Org {
  name: string;
  ownerUid: string;
  createdAt: number;
  country: string;   // "IN"
  currency: string;  // "INR"
}

export interface Member {
  uid: string;
  email: string;
  role: Role;
  addedAt: number;
}

/**
 * users/{uid}. The other half of every membership: `orgs/{orgId}/members/{uid}`
 * says an org has this member, `users/{uid}` says this member has that org.
 * listMyOrgs() reads only this document plus a getDoc() per org it names --
 * it cannot query `orgs` directly, because the org-read rule requires
 * checking membership per document (exists() on the members subcollection),
 * which Firestore cannot evaluate across an arbitrary collection query.
 * Readable and writable only by the uid it belongs to (firestore.rules).
 */
export interface UserIndex {
  orgs: string[];
  email: string;
  updatedAt: number;
}

/** Editable raw-material and conversion rates. Mirrors DEFAULT_RATES in the engine. */
export type Rates = Record<string, number>;

export interface RateCard {
  name: string;
  currency: string;
  rates: Rates;
  effectiveFrom: number;
  updatedBy: string;
  updatedAt: number;
}

/** The enquiry: the handful of things an engineer actually types. */
export interface EnquiryInput {
  application: string;
  standard: string;
  kva: number;
  hv: number;
  lv: number;
  freq: number;
  vector: string;
  dualHV: boolean;
  hv2: number;
  dualLV: boolean;
  lv2: number;
  effLevel: string;
  medium: "oil" | "dry";
  condPref: "auto" | "copper" | "aluminium" | "cca";
}

/** Commercial and document-control metadata. Does not affect the design. */
export interface ProjectMeta {
  customer: string;
  contractor: string;
  projectName: string;
  tender: string;
  revision: number;
  docPrefix: string;
  maker: string;
  designer: string;
  serial: string;
  year: number;
  altitude: number;
  site: string;
  paint: string;
}

export interface DesignSummary {
  kva: number;
  hv: number;
  lv: number;
  exWorks: number;
  delivered: number;
  noLoadLoss: number;
  loadLoss: number;
  impedance: number;
  efficiency: number;
  totalMass: number;
  compliant: boolean;
  engineVersion: string;
}

export type ProjectStatus = "draft" | "quoted" | "won" | "lost" | "in_production" | "dispatched";

export interface Project {
  id?: string;
  name: string;
  status: ProjectStatus;
  meta: ProjectMeta;
  currentRevision: number;
  summary: DesignSummary | null;
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
}

export interface Revision {
  id?: string;
  rev: number;
  note: string;
  /** Everything needed to reproduce the design, and nothing else. */
  input: {
    core: EnquiryInput;
    over: Record<string, number | string | boolean>;
    meta: ProjectMeta;
    extras: Array<{ code: string; desc: string; qty: number; unit: string; rate: number }>;
    budgetMin: number;
    budgetMax: number;
    searchOpts: Record<string, unknown>;
    /** TASKS.md item 11.4: a negotiated rate for this project only, keyed by
     *  engine rate key -- outranks every supplier and engineering-default
     *  price for that key. Optional because revisions saved before this
     *  field existed do not have it; read as {} when absent, never assume
     *  every revision carries one. */
    priceLocks?: Record<string, number>;
  };
  rateCardId: string;
  /** Frozen copy of the rates, so an old quotation reprices exactly as issued. */
  rateSnapshot: Rates;
  /** TASKS.md item 11.4: which tier (and, for a supplier, which one and what
   *  date) produced each key in rateSnapshot at the moment this revision was
   *  saved. Frozen alongside rateSnapshot for the same reason: an item or
   *  supplier record can change or be deleted later, and "defensible six
   *  months later" means this revision must still be able to say where its
   *  own numbers came from without depending on that record still existing.
   *  Optional because revisions saved before this field existed do not have
   *  it; read as {} when absent. */
  rateSources?: Record<string, PriceResolution>;
  engineVersion: string;
  summary: DesignSummary;
  locked: boolean;
  createdBy: string;
  createdAt: number;
}

export interface GeneratedDocument {
  id?: string;
  docNo: string;
  title: string;
  reportNo: number;         // 1..28 from the register
  revision: number;
  status: "generated" | "partial" | "needs_input";
  storagePath: string | null;
  generatedBy: string;
  generatedAt: number;
}

/**
 * TASKS.md item 11.2. Master data, not design data: editable in place, no
 * effective-from dating (a phone number or a lead time changing is not a
 * priced event the way a rate is). The item master (11.3) is where an
 * individual supplier's price against a specific item lives; this is only
 * the supplier's own record.
 */
export interface Supplier {
  name: string;
  gstNumber: string;
  contact: { person: string; phone: string; email: string };
  /** Free-text categories, not a price list -- "Copper", "CRGO Steel",
   *  "Bushings and Insulators". The item master is where a price against a
   *  specific item code lives. */
  materialsSupplied: string[];
  leadTimeDays: number;
  paymentTerms: string;
  /** 1 to 5, no fractional half-stars -- whole numbers a rating discussion
   *  can actually agree on. */
  rating: number;
  updatedBy: string;
  updatedAt: number;
}

/**
 * MANUFACTURING.md section 8: standing shop instructions -- works practice,
 * not a calculation, and never generated. Edited in place like Supplier, no
 * effective-from dating; a note being retired or reworded is not a priced
 * event worth preserving history for. `fromReferenceSheet` marks the seven
 * examples MANUFACTURING.md itself carries from the two reference sheets --
 * kept distinguishable from a works' own notes so it stays visibly "review
 * this, it came from a sample sheet" rather than blending in as if the
 * platform generated it.
 */
export interface ShopNote {
  text: string;
  category: "winding" | "core" | "tank" | "general";
  fromReferenceSheet: boolean;
  updatedBy: string;
  updatedAt: number;
}

/** Matches buildBOM's own segment lettering (packages/engine/index.js),
 *  never a second taxonomy invented at the app layer: A core & coil, B tank/
 *  cooling/fluid (or enclosure/finishing, dry type), C accessories and
 *  terminations, D additional items. */
export type ItemCategory = "A" | "B" | "C" | "D";

/**
 * TASKS.md item 11.3. One quotation received against one item from one
 * supplier, kept even after it expires or is superseded -- "what makes a
 * rate defensible six months later" is the full history, not just today's
 * number. `source` here is documentary evidence (how this number was
 * obtained), a different question from the price-source *tier* (11.4,
 * PriceSourceTier below) that decides which record of possibly several
 * actually prices the BOM.
 */
export interface ItemPrice {
  supplierId: string;
  unitPrice: number;
  gstPct: number;
  discountPct: number;
  /** A lump sum tied to a specific order, not a per-unit figure -- kept for
   *  audit and shown beside the price, never divided by an assumed quantity
   *  into a per-kg addition the item master has no basis to guess. */
  freight: number;
  effectiveFrom: number;
  /** null = no expiry set. */
  expiresAt: number | null;
  source: "quotation" | "purchase_order" | "invoice" | "rate_contract" | "verbal" | "catalogue";
  remarks: string;
  /** Only an approved price is eligible as the "latest approved supplier
   *  price" fallback tier -- a submitted-but-unverified quote is not
   *  quietly used to price a customer's transformer. */
  approved: boolean;
  createdBy: string;
  createdAt: number;
}

/**
 * TASKS.md item 11.3. `rateKey` is what connects this master record to
 * costing: it must name one of the engine's own DEFAULT_RATES keys
 * (packages/engine/index.js), and src/lib/pricing.ts's resolveRates() folds
 * whichever price this item resolves to over that key's rate-card figure.
 * An item with no rateKey (or one that names a key the engine does not
 * have) is master data only -- reference information, not yet wired into
 * any price.
 */
export interface Item {
  code: string;
  description: string;
  unit: string;
  category: ItemCategory;
  rateKey: string;
  /** "" = no company-designated default supplier for this item. */
  preferredSupplierId: string;
  /** Manufacturer or catalogue part number -- distinct from `code`, which is
   *  this works' own item-master code. "" if none is held; the BOM must not
   *  invent one to fill the column. */
  partNumber: string;
  prices: ItemPrice[];
  updatedBy: string;
  updatedAt: number;
}

/** TASKS.md item 11.4. Which of the four tiers actually produced a given
 *  BOM rate, in priority order (checked in this order, first match wins,
 *  falling through to engineering-default -- the rate card -- if nothing
 *  else resolves). */
export type PriceSourceTier =
  | "project-locked" | "company-supplier" | "latest-approved-supplier" | "engineering-default";

/** One rate key's resolved provenance -- src/lib/pricing.ts computes these,
 *  this file only declares the shape, so a Revision (a Firestore document
 *  shape) can reference it without lib/ ever importing from src/. */
export interface PriceResolution {
  tier: PriceSourceTier;
  value: number;
  supplierId?: string;
  supplierName?: string;
  date?: number;
}
