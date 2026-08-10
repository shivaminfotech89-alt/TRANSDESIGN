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
  };
  rateCardId: string;
  /** Frozen copy of the rates, so an old quotation reprices exactly as issued. */
  rateSnapshot: Rates;
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
