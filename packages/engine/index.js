/**
 * Transformer design engine.
 *
 * Pure functions only: no React, no Firebase, no DOM. Everything the platform
 * shows is derived from these, so nothing downstream can hold a stale number.
 *
 * ENGINE_VERSION is stamped onto every saved revision. Never change a formula
 * without bumping it, or old quotations stop reproducing.
 */

export const ENGINE_VERSION = "1.21.0";

const CONDUCTORS = {
  copper: { name: "Copper, EC grade", rho20: 0.017241, alpha: 0.00393, dens: 8890, dMax: 3.6, short: "Cu", proof: 1.0 },
  aluminium: { name: "Aluminium, EC grade", rho20: 0.028264, alpha: 0.00403, dens: 2703, dMax: 2.3, short: "Al", proof: 0.52 },
  cca: { name: "Copper-clad aluminium", rho20: 0.02150, alpha: 0.00400, dens: 3630, dMax: 2.9, short: "CCA", proof: 0.6 },
};

const CORE_GRADES = {
  m5: { thk: 0.30, name: "CRGO M5, 0.30 mm", wRef: 1.25, vaRef: 3.60, bRef: 1.7, sf: 0.965, rate: 288, bMax: 1.75, noise: 2 },
  m4: { thk: 0.27, name: "CRGO M4, 0.27 mm", wRef: 1.05, vaRef: 3.00, bRef: 1.7, sf: 0.970, rate: 305, bMax: 1.75, noise: 0 },
  m0h: { thk: 0.23, name: "CRGO M0H HiB, 0.23 mm", wRef: 0.88, vaRef: 2.60, bRef: 1.7, sf: 0.970, rate: 362, bMax: 1.80, noise: -2 },
  zdkh: { thk: 0.23, name: "CRGO ZDKH laser-scribed, 0.23 mm", wRef: 0.78, vaRef: 2.30, bRef: 1.7, sf: 0.970, rate: 405, bMax: 1.80, noise: -3 },
  amor: { thk: 0.025, name: "Amorphous 2605HB1 ribbon", wRef: 0.20, vaRef: 1.00, bRef: 1.35, sf: 0.860, rate: 470, bMax: 1.40, noise: 4 },
};

/* Joint construction: building factor on loss, and on exciting VA */
const CORE_TYPES = {
  stepLap: { name: "Step-lap mitred, circular stepped", shape: "circ", bf: 1.10, exc: 1.8, costMul: 1.05, grades: "crgo" },
  dType: { name: "D type, 45\u00B0 mitred, circular stepped", shape: "circ", bf: 1.18, exc: 2.6, costMul: 1.00, grades: "crgo" },
  sType: { name: "S type, butt-lap, circular stepped", shape: "circ", bf: 1.26, exc: 3.6, costMul: 0.96, grades: "crgo" },
  amorWound: { name: "Amorphous wound, shell & core", shape: "rect", aspect: 1.8, bf: 1.28, exc: 2.5, costMul: 1.18, grades: "amor" },
  elliptical: { name: "Elliptical wound core", shape: "rect", aspect: 2.0, bf: 1.15, exc: 2.2, costMul: 1.02, grades: "crgo" },
  rectangular: { name: "Rectangular wound core", shape: "rect", aspect: 2.2, bf: 1.15, exc: 2.2, costMul: 1.00, grades: "crgo" },
  ei: { name: "EI stamped core", shape: "rect", aspect: 1.5, bf: 1.38, exc: 4.5, costMul: 0.90, grades: "crgo" },
};

const STEP_UTIL = { 3: 0.851, 5: 0.908, 7: 0.934, 9: 0.948, 11: 0.955, 13: 0.960, 15: 0.963 };

/* Highest voltage for equipment -> standard withstand levels (IS 2026 / IEC 60076-3) */
const UM_LEVELS = {
  1.1: { li: 0, ac: 3 }, 3.6: { li: 40, ac: 10 }, 7.2: { li: 60, ac: 20 },
  12: { li: 75, ac: 28 }, 17.5: { li: 95, ac: 38 }, 24: { li: 125, ac: 50 },
  36: { li: 170, ac: 70 }, 52: { li: 250, ac: 95 }, 72.5: { li: 325, ac: 140 },
  145: { li: 650, ac: 275 },
};
const bushMul = (um) => (um <= 1.1 ? 0.4 : um <= 12 ? 1 : um <= 24 ? 1.8 : um <= 36 ? 2.8 : um <= 52 ? 5.0 : um <= 72.5 ? 9.0 : 22);

/* IEC 60076-1 vector group notation: HV connection letter, an optional
   capital N if the HV star point is brought out, LV connection letter
   (lower case), an optional lowercase n if the LV star point is brought
   out, clock number. A delta side (D or d) never carries a neutral -- there
   is no star point to bring out.
   ENGINE_VERSION 1.2.0: this used to live only in the app layer
   (src/lib/vectorGroup.ts) and buildBOM priced bushings at a fixed qty (3
   HV, 4 LV) regardless of vector group. The 2D layout drawings and the 3D
   model already read the real count from this same parsing; the BOM now
   does too, so a design with a delta LV (no neutral, 3 bushings) or an
   earthed HV neutral (4 bushings) is not quoted for bushings it does not
   have, or missing one it does. */
function parseVectorGroup(vector) {
  const m = /^([DYZ])(N)?([dyz])(n)?(\d+)$/.exec(vector || "");
  const hv = m ? m[1] : "D";
  const hvNeutral = !!(m && m[2]);
  const lv = m ? m[3] : "y";
  const lvNeutral = !!(m && m[4]);
  const clock = m ? parseInt(m[5], 10) : 11;
  return {
    hv, hvNeutral, lv, lvNeutral, clock,
    hvLabels: ["1U", "1V", "1W", ...(hvNeutral ? ["1N"] : [])],
    lvLabels: ["2u", "2v", "2w", ...(lvNeutral ? ["2n"] : [])],
  };
}

/* Liquids and dry systems */
const FLUIDS = {
  mineral: { name: "Mineral oil, IS 335 / IEC 60296", dens: 0.86, rate: 135, riseLimit: 50, wRiseLimit: 55, dissMul: 1.00 },
  naturalEster: { name: "Natural ester, FR3 type", dens: 0.92, rate: 330, riseLimit: 65, wRiseLimit: 75, dissMul: 0.88 },
  syntheticEster: { name: "Synthetic ester", dens: 0.97, rate: 420, riseLimit: 65, wRiseLimit: 75, dissMul: 0.90 },
  silicone: { name: "Silicone fluid", dens: 0.96, rate: 520, riseLimit: 60, wRiseLimit: 65, dissMul: 0.85 },
};
const DRY_TYPES = {
  castResin: { name: "Cast resin encapsulated", clrMul: 2.2, resinRate: 380, encRate: 155, classDefault: "F" },
  vpi: { name: "VPI, vacuum pressure impregnated", clrMul: 3.0, resinRate: 180, encRate: 140, classDefault: "F" },
  openWound: { name: "Open wound, varnished", clrMul: 3.4, resinRate: 90, encRate: 130, classDefault: "B" },
};
/* Insulation class -> permissible average winding rise and loss reference temperature */
const INS_CLASS = {
  A: { name: "A, 105 \u00B0C", rise: 60, ref: 75 }, E: { name: "E, 120 \u00B0C", rise: 75, ref: 75 },
  B: { name: "B, 130 \u00B0C", rise: 80, ref: 95 }, F: { name: "F, 155 \u00B0C", rise: 100, ref: 115 },
  H: { name: "H, 180 \u00B0C", rise: 125, ref: 130 },
};

const STANDARDS = {
  IS: { name: "IS 2026 / IS 1180", oilRise: 50, windRise: 55, zTol: 10, lossTolTotal: 10, lossTolPart: 15 },
  IEC: { name: "IEC 60076", oilRise: 60, windRise: 65, zTol: 10, lossTolTotal: 10, lossTolPart: 15 },
  ANSI: { name: "ANSI / IEEE C57.12", oilRise: 65, windRise: 65, zTol: 7.5, lossTolTotal: 6, lossTolPart: 6 },
  CBIP: { name: "CBIP Manual", oilRise: 50, windRise: 55, zTol: 10, lossTolTotal: 10, lossTolPart: 15 },
  ECBC: { name: "ECBC / BEE labelling", oilRise: 50, windRise: 55, zTol: 10, lossTolTotal: 10, lossTolPart: 15 },
  SANS: { name: "SANS 780", oilRise: 60, windRise: 65, zTol: 10, lossTolTotal: 10, lossTolPart: 15 },
  ECO: { name: "European Eco-design 548/2014", oilRise: 60, windRise: 65, zTol: 10, lossTolTotal: 0, lossTolPart: 0 },
  GOST: { name: "GOST", oilRise: 55, windRise: 65, zTol: 10, lossTolTotal: 10, lossTolPart: 15 },
};

/* Application presets. stray (eddy + stray loss as a percentage of I2R) had
   no source behind any of these eight figures until CALIBRATION.md section
   45 -- the designer's own stated practice for harmonic-duty loads is 15-25%.
   rectifier (24), solar (20) and ups (22) already sat inside that range;
   furnace was the one outside it, at 26, with nothing behind that specific
   number either. Furnace duty (arc furnace supply, the most harmonic-severe
   of the four) is anchored at the top of the stated range, 25, rather than
   left at an unsourced figure one point past it. Every other value here
   (etK, z, tap, cool) is unchanged and still not individually sourced --
   only stray was checked and fixed this pass. */
const APPS = {
  distribution: { name: "Distribution", etK: 0.45, z: 5.0, stray: 12, tap: "octc", cool: "ONAN" },
  power: { name: "Power", etK: 0.53, z: 10.0, stray: 15, tap: "oltc", cool: "ONAF" },
  rectifier: { name: "Rectifier / converter duty", etK: 0.50, z: 8.0, stray: 24, tap: "octc", cool: "ONAN" },
  furnace: { name: "Furnace duty", etK: 0.50, z: 7.0, stray: 25, tap: "oltc", cool: "OFAF" },
  isolation: { name: "Isolation", etK: 0.42, z: 4.0, stray: 10, tap: "none", cool: "ONAN" },
  solar: { name: "Solar / inverter duty", etK: 0.46, z: 6.0, stray: 20, tap: "octc", cool: "ONAN" },
  ups: { name: "UPS duty", etK: 0.44, z: 5.0, stray: 22, tap: "none", cool: "ONAN" },
  unitAux: { name: "Unit auxiliary", etK: 0.50, z: 7.15, stray: 14, tap: "octc", cool: "ONAN" },
};

/* Efficiency levels. Baseline fitted to Indian distribution practice, then scaled. */
const EFF_LEVELS = {
  conventional: { name: "Conventional", mul: 1.55 },
  level1: { name: "Level 1", mul: 1.22 },
  level2: { name: "Level 2", mul: 1.00 },
  level3: { name: "Level 3", mul: 0.82 },
  custom: { name: "Enter my own limits", mul: 1.00 },
};
/* Load loss coefficient recalibrated from 52 to 32, CALIBRATION.md, the
   630 kVA Level 1 costing sheet. Two independent oil designs confirm it at
   Level 2 (m = 1.00), the level neither reference design's own guaranteed
   figure needed a multiplier to match: 630 kVA gives 4461 W against the
   sheet's own 4400 W, 1250 kVA gives 7540 W against the existing OLTC
   reference's own 7600 W -- the same 7600 W CALIBRATION.md's "Not adopted"
   section previously called a premium figure well above the (old,
   coefficient-52) schedule estimate of 12,253 W. It was not premium; the
   coefficient was wrong. See "Not adopted" for the correction. The 0.766
   exponent and the no-load formula are both untouched -- neither reference
   sheet gave evidence against either. */
/* CALIBRATION.md section 30: the no-load coefficient (4.6) was left
   untouched at section 6 for a named reason -- no real no-load figure to
   anchor it against, and two adjacent mid-range points cannot honestly fit
   both a coefficient and an exponent. Two furnace core charts (section 28)
   are the first real no-load guarantees since then: 800 kVA at 1160 W and
   1250 kVA at 1390 W (plus the existing 1250 kVA Mehir reference at
   1400 W) against this formula's own 999/1431/1431 W at Level 2 -- 14%
   tight at 800 kVA. Still two mid-range points, though (800 and 1250 kVA,
   a 1.56x span, not the 100-300 kVA and 2000 kVA+ points section 6 asked
   for), so only the coefficient moves, exponent held at 0.805 -- the same
   restraint section 6 applied to the load-loss coefficient (52 -> 32,
   exponent 0.766 untouched). A full two-parameter refit was computed and
   rejected: it fits all three points to within 0.36%, but extrapolates to
   2.6x the current prediction at 100 kVA and 0.28x at 31500 kVA, because
   two of the three points share one kVA and the exponent is effectively
   set by a single ratio. 4.6 -> 4.75 (geometric mean of the coefficient
   implied by each of the three points at the existing exponent) is a flat
   +3.3% at every rating, not a reshaping. */
function lossSchedule(kva, level, dry) {
  const m = (EFF_LEVELS[level] || EFF_LEVELS.level2).mul;
  const kn = dry ? 1.45 : 1, kl = dry ? 1.20 : 1;
  return { nll: 4.75 * Math.pow(kva, 0.805) * m * kn, ll: 32 * Math.pow(kva, 0.766) * m * kl };
}

/* ---------------- Clearances from withstand levels ---------------- */
/* CALIBRATION.md item 1: two Mehir Transformers production sheets, both
   11 kV class (Um 12 kV, 75 kVp LI), give a complete LV-HV radial gap
   (cylinder and both oil ducts included) of 11 mm in oil against the old
   6 + 0.19*bilHV formula's 20.25 mm there -- the base was roughly 1.8x too
   large. The 0.19 slope is untouched: two sheets at one voltage class fix
   one point on the curve, not its slope, so only the intercept moves,
   solved from 11 = intercept + 0.19*75. The dry multiplier (DRY_TYPES'
   clrMul) is also untouched -- the sheets' oil:dry ratio (11:25, 2.27)
   already matches the engine's old ratio (2.25) to within one per cent, so
   nothing there was wrong. Floored at 6 mm, the old formula's own value at
   bilHV = 0, since shifting the intercept negative would otherwise give a
   nonsensical clearance for very low voltage classes no sheet has checked.
   UNVERIFIED above 11 kV: both sheets are the same voltage class, so the
   36 kV+ (Um) end of this line has not been confirmed against anything.
   Ask for a 33 kV class sheet before ever touching the slope. */
function clearancesFrom(bilHV, bilLV, medium, dryType) {
  const k = medium === "dry" ? DRY_TYPES[dryType].clrMul : 1;
  return {
    coreLvClr: Math.round(Math.max(8, 3 + 0.5 * bilLV) * k),
    lvHvClr: Math.round(Math.max(6, -3.25 + 0.19 * bilHV) * k),
    phaseClr: Math.round((4 + 0.16 * bilHV) * k),
    endClrLV: Math.round(Math.max(25, 10 + 0.5 * bilLV) * k),
    endClrHV: Math.round((15 + 0.52 * bilHV) * k),
    hvTankClr: Math.round((20 + 0.65 * bilHV) * k),
    endTankClr: Math.round((25 + 0.65 * bilHV) * k),
    cylThk: 1.5 + 0.02 * bilHV,
  };
}

/* ============================================================
   AUTO-DERIVATION
   A short enquiry in, every design parameter out, each with a
   working range and a suggested value the user can override.
   ============================================================ */

const UM_STEPS = [1.1, 3.6, 7.2, 12, 17.5, 24, 36, 52, 72.5, 145];
const umFor = (v) => UM_STEPS.find((u) => u >= (v / 1000) * 1.045) ?? 145;

function zSuggest(kva, um) {
  let z = kva <= 630 ? 4.5 : kva <= 2500 ? 5.0 : kva <= 10000 ? 6.25 : kva <= 31500 ? 8.0 : 12.5;
  if (um >= 72.5) z = Math.max(z, 10);
  else if (um >= 36 && kva > 2500) z = Math.max(z, 8);
  return z;
}
const gradeSuggest = (lvl) => (lvl === "conventional" ? "m5" : lvl === "level1" ? "m4" : lvl === "level2" ? "m0h" : "zdkh");
function fluxSuggest(gk, lvl, kva) {
  if (gk === "amor") return 1.35;
  const nudge = kva < 250 ? 0.08 : kva < 630 ? 0.04 : 0;
  const b = lvl === "conventional" ? 1.70 : lvl === "level1" ? 1.66 : lvl === "level2" ? 1.60 : 1.55;
  return Math.round(Math.min(b - nudge, CORE_GRADES[gk].bMax - 0.03) * 100) / 100;
}
/* CALIBRATION.md item 3: the number of steps fills a circle, so it should
   track the core diameter being filled, not the rating directly -- the
   1250 kVA sheet uses 15 steps where the old kva-keyed table suggested only
   9. Bands are the "roughly" ranges CALIBRATION.md gives, split at their
   midpoints since the sheets pin two points inside them (271 mm at 15
   steps, 245 mm implying 13) rather than every boundary. Takes an estimated
   diameter, not kva -- see deriveSpec's dCoreEst for how that estimate is
   built this early, before a real one exists. */
const stepsSuggest = (dCoreEst) => (
  dCoreEst <= 70 ? 3 : dCoreEst <= 100 ? 5 : dCoreEst <= 150 ? 7 : dCoreEst <= 200 ? 9
    : dCoreEst <= 230 ? 11 : dCoreEst <= 260 ? 13 : 15
);
function densitySuggest(kva, cond, dry, isHV) {
  const l = Math.log10(Math.max(10, kva));
  const cu = 2.65 - 0.125 * (l - 2);
  let b = cond === "copper" ? cu : cond === "aluminium" ? cu * 0.78 : cu * 0.88;
  /* CALIBRATION.md item 4: this used to multiply by 0.82, reasoning that air
     cools worse than oil, and had the direction backwards -- class F's
     100 K permitted rise against oil's 55 K dominates over the weaker
     cooling, so a dry winding actually runs a HIGHER current density than
     oil at the same rating, not a lower one. The 630 kVA sheet runs
     2.79/2.89 A/mm^2 (LV/HV) where the old factor suggested 2.10/2.25.
     1.10 is fitted from that sheet, the only dry one available. */
  if (dry) b *= 1.10;
  if (isHV) b += 0.15;
  return Math.min(Math.round(b * 20) / 20, CONDUCTORS[cond].dMax);
}
const aspectSuggest = (um) => Math.min(3.4, Math.max(2.2, Math.round((2.4 + 0.02 * um) * 20) / 20));
const rng = (v, lo, hi, st) => [Math.round(v * lo * 100) / 100, Math.round(v * hi * 100) / 100, st];

const ESSENTIALS = {
  application: "distribution", standard: "IS",
  kva: 1000, hv: 11000, lv: 433, freq: 50, vector: "Dyn11",
  dualHV: false, hv2: 22000, dualLV: false, lv2: 415, dualRating: false,
  effLevel: "level2", medium: "oil", condPref: "auto",
};

function deriveSpec(core, over = {}) {
  const SUG = {}, RNG = {}, OPT = {}, NOTE = {};
  const S = { ...core, autoClearance: false };
  const put = (k, sug, range, options, note) => {
    SUG[k] = sug;
    if (range) RNG[k] = range;
    if (options) OPT[k] = options;
    if (note) NOTE[k] = note;
    S[k] = over[k] !== undefined ? over[k] : sug;
    return S[k];
  };
  const std = STANDARDS[core.standard] || STANDARDS.IS;
  const app = APPS[core.application] || APPS.distribution;
  const dry = core.medium === "dry";
  const kva = core.kva || 1;
  const hvMax = core.dualHV ? Math.max(core.hv, core.hv2) : core.hv;
  const lvMax = core.dualLV ? Math.max(core.lv, core.lv2) : core.lv;
  const umOpts = UM_STEPS.map((u) => [u, u + " kV"]);

  /* --- insulation levels --- */
  const umHV = put("umHV", umFor(hvMax), null, umOpts, "Smallest standard highest-voltage-for-equipment above your HV system voltage.");
  put("bilHV", UM_LEVELS[umHV].li, [0, 750, 5], null, `Standard lightning impulse for Um ${umHV} kV. Raise it only if the enquiry asks for a higher level.`);
  put("acHV", UM_LEVELS[umHV].ac, [0, 325, 1], null, "One-minute separate-source AC withstand for this Um.");
  const umLV = put("umLV", umFor(lvMax), null, umOpts, "Follows the LV system voltage.");
  put("bilLV", UM_LEVELS[umLV].li, [0, 750, 5], null, "LT windings below 1.1 kV carry no impulse level.");
  put("acLV", UM_LEVELS[umLV].ac, [0, 325, 1], null, "One-minute AC withstand on the LV side.");

  /* --- fluid or dry system --- */
  if (dry) {
    const dt = put("dryType", "castResin", null, Object.entries(DRY_TYPES).map(([k, v]) => [k, v.name]), "Cast resin is the usual choice for indoor duty; VPI is cheaper but needs a cleaner environment.");
    put("fluid", "mineral", null, null, null);
    put("insClass", DRY_TYPES[dt].classDefault, null, Object.entries(INS_CLASS).map(([k, v]) => [k, v.name]), "Class F is standard for cast resin. Class H buys temperature headroom at a price.");
    put("cooling", "AN", null, [["AN", "AN, natural air"], ["AF", "AF, forced air"]], "Natural air until the losses need fans.");
    put("tankType", "fin", null, null, null);
    put("oilRiseTarget", 50, [30, 60, 1], null, null);
  } else {
    const fl = put("fluid", "mineral", null, Object.entries(FLUIDS).map(([k, v]) => [k, v.name]), "Mineral oil unless the site needs the fire point of an ester.");
    put("dryType", "castResin", null, null, null);
    put("insClass", "A", null, Object.entries(INS_CLASS).map(([k, v]) => [k, v.name]), "Liquid-immersed windings are class A.");
    const cool1 = put("cooling", kva <= 5000 ? "ONAN" : "ONAF", null, [["ONAN", "ONAN"], ["ONAF", "ONAF"], ["OFAF", "OFAF"], ["ODAF", "ODAF"]], "Natural circulation is normal up to about 5 MVA.");
    /* CALIBRATION.md section 24: rating alone used to decide this. Rating
       is a proxy for required cooling surface, not the thing itself -- a
       design with a tight rise target or forced cooling at a modest rating
       can need more surface than a corrugated fin wall practically carries
       well under 2500 kVA, and rating alone would keep it on a fin wall
       anyway. Estimated here from the loss schedule directly (this design's
       own finAreaReq is not known yet -- it needs the full geometry solve
       designTransformer runs later -- so this is a coarse pre-estimate off
       nominal finDiss/50 K, not the design's own eventual figure) against a
       practical fin-wall ceiling, itself a fitted round number, not a
       vendor's own limit. Rating still dominates: crossing 2500 kVA always
       forces radiator regardless of this estimate, since mechanical size
       and service access favour radiators above that regardless of a
       lighter loss; the estimate only ever pulls a smaller rating UP to
       radiator, never a larger one back down to fin. */
    const estSch = lossSchedule(kva, core.effLevel === "custom" ? "level2" : core.effLevel, dry);
    const estForced = cool1 === "ONAF" ? 1.5 : cool1 === "OFAF" || cool1 === "ODAF" ? 2.1 : 1.0;
    const FIN_WALL_CEILING_M2 = 90;
    const estAreaM2 = (estSch.nll + estSch.ll) / (250 * estForced * Math.pow(50, 1.25));
    put("tankType", kva > 2500 || estAreaM2 > FIN_WALL_CEILING_M2 ? "radiator" : "fin", null,
      [["fin", "Corrugated fin, sealed"], ["radiator", "Radiator + conservator"]],
      `Fin tanks up to about 2500 kVA or an estimated ${FIN_WALL_CEILING_M2} m² of required cooling surface (~${Math.round(estAreaM2)} m² estimated here), radiators above either.`);
    put("oilRiseTarget", Math.min(std.oilRise, FLUIDS[fl].riseLimit), [30, Math.min(std.oilRise, FLUIDS[fl].riseLimit), 1], null, `Design to the ${std.name} limit. Lower means more cooling surface and more cost.`);
    put("radiatorPanelWidth", 520, [400, 650, 10], null, "Pressed-steel radiator panel width. 520 mm is typical Indian practice; override to your supplier's own panel.");
    put("radiatorPanelPitch", 45, [30, 65, 1], null, "Centre-to-centre spacing between adjacent radiator panels in a bank. A fitted typical figure, not a specific vendor's panel.");
    put("radiatorPanelsPerBank", 16, [6, 30, 1], null, "Panels bolted into one removable bank before another bank is started. A practical handling limit, not a physical one -- override to your works' own practice.");
    put("conservatorPct", 10, [7, 15, 0.5], null, "Conservator volume as a percentage of total oil volume, to allow for thermal expansion. 10% is conventional practice.");
    put("conservatorAspect", 2.08, [1.5, 3.0, 0.02], null, "Conservator length to diameter ratio. Fitted from the one reference figure on file (630 kVA sheet, 330 mm dia x 685 mm long) -- override once a second reference is available to check it against.");

    /* CALIBRATION.md section 21: dual rating, e.g. 5000 kVA ONAN / 6250 kVA
       ONAF from one tank -- routine practice at this size. Off by default,
       additive: the active part (turns, conductor area, current density)
       stays sized to kva/cooling alone, exactly as a single-rating design
       always has been. kva2/cooling2 exist only to give designTransformer's
       fin-area solve a second thermal check to satisfy (the natural point's
       own lower loss against the forced point's own higher loss), and to
       give the nameplate and GTP a second guaranteed-figure line -- they do
       not resize anything the active part depends on. */
    if (core.dualRating) {
      const coolMul = (c) => (c === "ONAF" ? 1.5 : c === "OFAF" || c === "ODAF" ? 2.1 : 1.0);
      const cool2 = put("cooling2", cool1 === "ONAN" ? "ONAF" : "ONAN", null,
        [["ONAN", "ONAN"], ["ONAF", "ONAF"], ["OFAF", "OFAF"], ["ODAF", "ODAF"]],
        "The second rating's own cooling type -- usually the natural type if the rating above is forced-cooled, or the forced type if the rating above is natural.");
      const ratio = coolMul(cool2) > coolMul(cool1) ? 1 / 0.8 : 0.8;
      const kva2 = put("kva2", Math.round((kva * ratio) / 25) * 25,
        [Math.round((kva * 0.5) / 25) * 25, Math.round((kva * 1.6) / 25) * 25, 25], null,
        "The second name-plate rating this same build is also sold at. 0.8 is the common IEC/IS natural-to-forced ratio between adjacent cooling stages; override with the declared figure.");
      const sch2 = lossSchedule(kva2, core.effLevel === "custom" ? "level2" : core.effLevel, dry);
      put("limitNLL2", Math.round(sch2.nll), [Math.round(sch2.nll * 0.5), Math.round(sch2.nll * 2), 5], null, `Estimated from the level formula for ${kva2} kVA. Replace it with the figure in the enquiry -- no-load loss does not change with rating, only the limit it is checked against does.`);
      put("limitLL2", Math.round(sch2.ll), [Math.round(sch2.ll * 0.5), Math.round(sch2.ll * 2), 25], null, `Estimated for ${kva2} kVA. Load loss at this rating is the primary rating's own load loss scaled by (kva2/kva)², not a separate design.`);
    }
  }
  put("refTemp", dry ? INS_CLASS[S.insClass].ref : 75, [55, 140, 5], null, "Temperature at which the load loss is declared.");
  const indian = ["IS", "CBIP", "ECBC"].includes(core.standard);
  put("ambient", indian ? 50 : 40, [20, 60, 1], null, indian ? "Indian practice: 50 \u00B0C maximum." : "40 \u00B0C maximum for this standard.");
  put("ambientAvg", indian ? 32 : 20, [10, 45, 1], null, "Yearly weighted ambient. Only used for the insulation-ageing figure.");

  /* --- losses and impedance --- */
  const sch = lossSchedule(kva, core.effLevel === "custom" ? "level2" : core.effLevel, dry);
  put("limitNLL", Math.round(sch.nll), [Math.round(sch.nll * 0.5), Math.round(sch.nll * 2), 5], null, `Estimated from the level formula for ${kva} kVA. Replace it with the figure in the enquiry.`);
  put("limitLL", Math.round(sch.ll), [Math.round(sch.ll * 0.5), Math.round(sch.ll * 2), 25], null, `Estimated for ${kva} kVA. Replace it with the figure in the enquiry.`);
  const z = put("targetZ", zSuggest(kva, umHV), [3, 14, 0.25], null, `Standard value for ${kva} kVA at ${umHV} kV. Going lower raises fault current; going higher worsens regulation.`);
  put("zTol", z >= 10 ? 7.5 : std.zTol, [5, 10, 0.5], null, `${std.name} allows \u00B1${z >= 10 ? 7.5 : std.zTol}% on the declared impedance.`);

  /* --- core --- */
  const gk = put("coreGrade", gradeSuggest(core.effLevel), null, Object.entries(CORE_GRADES).map(([k, v]) => [k, v.name]), `Thinner, lower-loss steel is what buys the ${EFF_LEVELS[core.effLevel].name} no-load figure.`);
  const ctk = put("coreType", gk === "amor" ? "amorWound" : "stepLap", null, Object.entries(CORE_TYPES).map(([k, v]) => [k, v.name]), "Step-lap mitred joints cut no-load loss and exciting current against a plain mitred or butt-lap joint.");
  put("buildFactor", CORE_TYPES[ctk].bf, [1.0, 1.45, 0.01], null, "Ratio of built core loss to catalogue loss for this joint. Set it from your own no-load test history if you have it.");
  const fluxSug = put("flux", fluxSuggest(gk, core.effLevel, kva), [1.20, CORE_GRADES[gk].bMax, 0.01], null, "Higher flux means a smaller, cheaper core and a higher no-load loss. This is the single biggest cost-versus-loss lever.");
  /* CALIBRATION.md item 2: raised, and now split by medium -- a dry-type
     winding runs a higher K than the same duty in oil. Fitted from Mehir
     Transformers' two reference sheets: distribution's raw 0.45 -> 0.544
     measured in oil (x1.21) -> 0.623 measured dry (x1.38). Both multipliers
     are applied to every application's own base K, not just distribution's,
     so the relative ordering already tuned into APPS (power runs higher
     than distribution, isolation lower, and so on) is preserved -- only
     distribution's own multiplier is confirmed by a sheet; the rest are
     scaled by the same ratio, unverified. This raises cost, not lowers it:
     a higher K needs a bigger core for the same flux density (Et = 4.44 f B
     Ai), which is why CALIBRATION.md pairs this with item 1's clearance cut
     rather than presenting either alone. */
  const etkMul = dry ? 1.38 : 1.21;
  const etkSug = Math.round(app.etK * etkMul * 1000) / 1000;
  const etkEff = put("etK", etkSug, [0.35, 0.80, 0.01], null, `Volts per turn = K\u221AkVA. ${app.name} practice in ${dry ? "a dry-type winding" : "oil"} sits near ${etkSug}.`);
  /* CALIBRATION.md item 3: step count should track the core diameter being
     filled (STEP_UTIL is a circle-packing factor), not the rating directly
     -- the 1250 kVA sheet uses 15 steps where the old kva-keyed table gave
     9. There is no real core diameter yet this early in deriveSpec (it
     depends on turns, which depend on the window solve in
     designTransformer) -- estimate one from the same trial Et and flux
     density just suggested above, using a fixed nominal utilisation
     (0.94, designTransformer's own fallback when no step count is chosen
     yet) rather than STEP_UTIL[steps], which needs the very step count this
     is choosing. It only has to land in the right band: stepWidths() and
     everything downstream always use the real STEP_UTIL[p.steps]
     regardless of how this estimate landed. Checked against both sheets:
     275 mm estimated vs 271 mm actual at 1250 kVA (15-step band), 248 mm vs
     245 mm at 630 kVA (13-step band).
     Uses etkEff (put()'s return value), not etkSug, so an explicit etK
     override -- reference-designs.test.mjs gives the designer's own Et for
     both sheets -- actually feeds this estimate instead of being silently
     ignored in favour of the auto-suggestion nobody asked for. */
  const etTrialSug = etkEff * Math.sqrt(kva);
  const aNetEst = etTrialSug / (4.44 * (core.freq || 50) * fluxSug);
  const dCoreEst = Math.sqrt((4 * aNetEst) / (Math.PI * 0.94 * CORE_GRADES[gk].sf)) * 1000;
  put("steps", stepsSuggest(dCoreEst), null, Object.keys(STEP_UTIL).map((k) => [+k, k + " steps"]), "More steps fill the coil circle better and save steel, but cost more to cut and stack.");
  put("stepIncrement", 10, [5, 25, 5], null, "Lamination is slit to standard widths, not cut to a continuous optimum. Step widths round down to the nearest multiple of this -- rounding up can put the widest step past the core diameter itself.");
  /* CALIBRATION.md section 35: Construction A (limb / half-yoke / full-yoke)
     is the established, better-evidenced pattern -- confirmed against two
     Mehir Transformers reference designs, not one furnace chart with a
     tautological three-coefficient fit. Defaults to A regardless of
     application; Construction B is selectable, not auto-suggested, until a
     second real chart confirms its own formula away from the one geometry
     it was solved against. */
  put("coreConstruction", "A", null, [["A", "Limb / half-yoke / full-yoke"], ["B", "V-notch / outer / centre"]], "How the core lamination is cut and stacked. Construction A is confirmed against two real reference builds; Construction B against one furnace core chart -- see CALIBRATION.md section 35 before relying on it away from similar proportions.");
  put("aspect", aspectSuggest(umHV), [2.0, 3.8, 0.05], null, "Starting window shape. The final height is solved to hit the declared impedance unless you turn that off.");
  /* CALIBRATION.md section 44: window height over window width (maxAspect,
     sections 28/32) replaced by the two real shop limits it was always a
     proxy for. A ratio is application-aware because different duties
     produce different ratios for the same actual coil; a shop's winding
     machine and crane/pit height are fixed pieces of equipment that do not
     change with the duty being wound, so the direct limits are NOT
     application-aware the way maxAspect's default was -- a furnace job on
     the same line has the same physical ceiling a distribution job does.
     If a specific job genuinely runs on different tooling, the design
     office sets that job's own number, the same as before. */
  put("coilHeightLimit", 880, [400, 1500, 10], null,
    "The taller of the LV and HV coil heights, mm. Past this the winding does not fit the shop's winding machine or handling equipment -- a real physical ceiling, not a proxy ratio.");
  put("tankHeightLimit", 1500, [800, 3000, 10], null,
    "Tank (or dry-type enclosure) height, mm. Past this the tank does not fit under the shop crane or through the shop's own handling constraints.");
  put("autoWindow", true, null, [[true, "Solve height for the declared impedance"], [false, "Use the output equation only"]], "With this on, the window height is adjusted until the calculated impedance matches the declared value, which is what a designer does by hand.");
  put("autoFit", true, null, [[true, "Fit flux and current density to the loss limits"], [false, "Use the rating-based values only"]], "With this on, the flux density and the current densities are trimmed until the calculated losses sit just inside the declared limits, the cheapest core and coil that still passes.");
  /* CALIBRATION.md section 37: fitToSchedule used to target a flat 0.96 of
     the declared limit for both no-load and load loss, with no evidence
     behind that specific number and no way to tell it apart from a real
     design margin. The HV conductor cross-check (section 37) found the
     real 630 kVA winding running roughly double the loss-optimal copper
     this engine's own 0.96 target implied, and the designer's own stated
     practice explains it directly: 6-8% margin on load loss, 8-10% on
     no-load, not a uniform 4%. marginTargetLL/NLL replace the hardcode,
     each independently editable -- a design office with its own tighter or
     looser practice sets its own number, the same as coilHeightLimit or
     tankHeightLimit. */
  put("marginTargetLL", 0.93, [0.85, 0.95, 0.01], null, "Fraction of the declared load-loss limit autoFit targets internally. 0.93 leaves 7% margin -- lower means less margin (cheaper, closer to the declared ceiling), higher means more.");
  put("marginTargetNLL", 0.90, [0.85, 0.95, 0.01], null, "Fraction of the declared no-load-loss limit autoFit targets internally. 0.90 leaves 10% margin.");
  put("windowSpace", 8, [6, 12, 0.5], null, "Numerator of the window space factor 8/(30+kV). Raise it if your coils pack tighter than average.");

  /* --- windings --- */
  /* CALIBRATION.md item 5: read literally, kva > 630 with a custom loss
     level fell through both conditions at exactly 630 kVA and silently
     returned aluminium -- entering your own loss targets must not change
     the winding metal. kva >= 630 closes the boundary gap; treating
     "custom" the same as level2/level3 closes the other one. */
  const condSug = core.condPref !== "auto" ? core.condPref
    : (kva >= 630 || ["level2", "level3", "custom"].includes(core.effLevel)) ? "copper" : "aluminium";
  const cLV = put("condLV", condSug, null, Object.entries(CONDUCTORS).map(([k, v]) => [k, v.name]), core.condPref === "auto" ? "Copper once the rating or the loss schedule makes aluminium coils too big." : "Set from your material preference.");
  const cHV = put("condHV", condSug, null, Object.entries(CONDUCTORS).map(([k, v]) => [k, v.name]), "Usually the same metal on both windings.");
  put("deltaLV", densitySuggest(kva, cLV, dry, false), rng(densitySuggest(kva, cLV, dry, false), 0.6, 1.35, 0.05), null, `Normal band for ${CONDUCTORS[cLV].short} at ${kva} kVA. Higher means less metal, more load loss and a hotter winding.`);
  put("deltaHV", densitySuggest(kva, cHV, dry, true), rng(densitySuggest(kva, cHV, dry, true), 0.6, 1.35, 0.05), null, `Normal band for ${CONDUCTORS[cHV].short} on the HV side.`);
  put("stray", app.stray, [6, 30, 1], null, `Eddy and stray loss as a percentage of I\u00B2R. ${app.name} duty runs near ${app.stray}%.`);

  /* --- tappings --- */
  const tt = put("tapType", app.tap, null, [["none", "No tappings"], ["octc", "Off-circuit tap changer"], ["oltc", "On-load tap changer"]], `${app.name} transformers normally use ${app.tap === "oltc" ? "an on-load tap changer" : app.tap === "octc" ? "an off-circuit tap switch" : "no tappings"}.`);
  const isO = tt === "oltc";
  put("tapPlus", tt === "none" ? 0 : 5, [0, 20, 0.5], null, "Range above the normal tap.");
  put("tapMinus", tt === "none" ? 0 : isO ? 15 : 5, [0, 20, 0.5], null, "Range below the normal tap.");
  put("tapStep", isO ? 1.25 : 2.5, null, [[0.625, "0.625 %"], [1.25, "1.25 %"], [1.5, "1.5 %"], [2.5, "2.5 %"], [3.0, "3.0 %"], [5.0, "5.0 %"]], "Step size between tap positions.");

  /* --- HV winding construction, MANUFACTURING.md section 5 --- */
  /* Layer below hvLayerMaxKva; disc once an OLTC is fitted or the rating
     reaches hvDiscMinKva; crossover in between. Practice, not physics --
     both thresholds are editable, and the two reference sheets pin only
     two points on this curve: 630 kVA dry, no tap changer forced (this
     application's own "octc" default) lands on crossover; 1250 kVA OLTC
     lands on disc regardless of hvDiscMinKva, since the OLTC rule alone
     already selects disc there. Nothing pins where a NON-OLTC design
     would cross from crossover to disc -- hvDiscMinKva's default is a
     placed-above-both-references guess, not a confirmed figure. */
  put("hvLayerMaxKva", 500, [100, 2000, 50], null, "Below this rating, HV is a single continuous layer winding. Practice, not physics -- confirmed only as \"roughly here\" by the reference sheets, not pinned exactly.");
  const hvDiscMinKva = put("hvDiscMinKva", 2000, [500, 5000, 100], null, "Above this rating, or whenever an on-load tap changer is fitted, HV moves to disc construction. The OLTC rule is confirmed by the 1250 kVA reference; this kVA threshold on its own is not.");
  const hvConstructionSug = kva < S.hvLayerMaxKva ? "layer" : (tt === "oltc" || kva >= hvDiscMinKva) ? "disc" : "crossover";
  put("hvConstruction", hvConstructionSug, null,
    [["layer", "Single continuous layer"], ["crossover", "Crossover coils"], ["disc", "Disc wound"]],
    `${kva} kVA${tt === "oltc" ? " with an on-load tap changer" : ""} normally uses ${hvConstructionSug} construction.`);
  put("hvCrossoverTurnsPerLayer", 10, [4, 20, 1], null, "Turns per axial layer within one crossover coil, kept small so each coil stays easy to wind and handle. Fitted from the 630 kVA dry reference.");
  /* 20 mm reproduces the 630 kVA dry reference's 6 coils of 13 layers of 10
     turns almost exactly (6/13/10 against a target of 6/13/10). Confirmed
     dry-type only -- an oil-immersed crossover winding would plausibly need
     less gap, the same way every other dry clearance in this engine is
     multiplied up for air insulation (clearancesFrom's dryType multiplier),
     but there is no oil-immersed crossover reference to fit that against,
     so the same figure is used for both media rather than guessing a split. */
  put("hvCoilGap", 20, [1, 30, 0.5], null, "Axial gap between adjacent crossover coils, for insulation, cooling and the crossover lead. Fitted from the 630 kVA dry reference; likely conservative for oil.");
  /* 3.5 mm, not the 4.5 mm ENGINE_VERSION 1.5.0 first fitted. LV multi-layer
     strip construction (below) shares the same window-height bisection --
     a correctly-built LV radial build changes how tall the window needs to
     be to hit the declared impedance, which changes how many discs the
     window holds, so getting LV right moved the disc count that best fits
     HV OD and tank length too. Refitted jointly with the LV parameters
     below rather than held fixed while only LV was tuned -- 4.5 mm on its
     own, with LV now correct, overshoots HV OD by several per cent. 44
     discs (the sheet's own count) no longer falls out of this fit; 53
     does, at HV OD within 1.5% and tank length within 1.4%, still real
     accuracy, just against a different disc count than the earlier,
     LV-still-wrong fit landed on. */
  put("hvDiscGap", 3.5, [1, 10, 0.1], null, "Axial gap between adjacent discs. Fitted jointly with the LV strip parameters against both reference sheets.");

  /* --- clearances from the impulse level --- */
  const cl = clearancesFrom(S.bilHV, S.bilLV, core.medium, S.dryType);
  const clNote = `Scaled from the ${S.bilHV} kVp impulse level${dry ? " and multiplied for air insulation" : ""}.`;
  put("coreLvClr", cl.coreLvClr, rng(cl.coreLvClr, 0.6, 2.2, 1), null, clNote);
  put("lvHvClr", cl.lvHvClr, rng(cl.lvHvClr, 0.6, 2.2, 1), null, clNote + " This gap also sets the impedance.");
  put("phaseClr", cl.phaseClr, rng(cl.phaseClr, 0.6, 2.2, 1), null, clNote);
  put("endClrLV", cl.endClrLV, rng(cl.endClrLV, 0.6, 2.2, 1), null, clNote);
  put("endClrHV", cl.endClrHV, rng(cl.endClrHV, 0.6, 2.2, 1), null, clNote);
  put("hvTankClr", cl.hvTankClr, rng(cl.hvTankClr, 0.6, 2.2, 1), null, clNote);
  put("endTankClr", cl.endTankClr, rng(cl.endTankClr, 0.6, 2.2, 1), null, clNote);
  put("cylThk", Math.round(cl.cylThk * 10) / 10, rng(cl.cylThk, 0.6, 2.2, 0.1), null, "Insulating cylinder thickness.");

  /* --- LV winding construction --- */
  /* Strip above lvFoilMaxKva, same approach as HV construction
     (MANUFACTURING.md): the turn's own required cross-section splits into
     axCount x radCount parallel conductors above the threshold, a single
     conductor (full-height foil, or a thin T_MIN strip sharing an axial
     pass with others) below it, unchanged from before this section
     existed. Confirmed at both reference ratings, which both sit above
     the threshold -- nothing here is confirmed at a rating small enough
     to still be foil, so treat lvFoilMaxKva as a placed-below-both-
     references guess for where the crossover actually is, the same
     caveat hvLayerMaxKva/hvDiscMinKva carry for HV.

     lvStripMaxMM2 caps one strand's own area. The axCount x radCount split
     itself is no longer a separate fitted ratio (ENGINE_VERSION 1.9.0):
     axCount comes directly from how many strand-widths of hLV are on
     offer once every turn that must share the layer is accounted for,
     and radCount absorbs whatever n does not fit axially -- see the build()
     closure below. Confirmed exactly at both references without any
     per-rating tuning: 630 kVA dry reaches 4 axial x 2 radial (the sheet's
     own "8 conductors in 4 axial by 2 radial") and 1250 kVA oil reaches
     5 axial x 6 radial (the sheet's own arrangement, previously 9 axial x
     2 radial x 4 layers and structurally wrong). The old aspect-ratio
     constant that used to live here could only ever fit one rating at a
     time, because axCount:radCount reduced to that constant regardless of
     scale -- it has been retired, not re-fitted. */
  put("lvFoilMaxKva", 300, [50, 1000, 50], null, "Below this rating, LV is a single conductor -- full-height foil, or a thin strip if several turns share an axial pass. Above it, LV splits into parallel conductors.");
  put("lvStripMaxMM2", 40, [10, 150, 5], null, "Practical area for one LV strip conductor before it splits into more than one, arranged axial x radial.");
  put("lvStripGap", 2, [0.5, 6, 0.5], null, "Gap between LV strip conductors placed side by side axially within one turn.");

  /* --- construction constants --- */
  put("lvIns", 0.30, [0.10, 1.20, 0.05], null, "Interturn insulation on the LV foil or strip.");
  put("hvPaper", 0.45, [0.20, 1.50, 0.05], null, "Paper covering on the HV conductor, on diameter.");
  put("hvInterlayer", Math.round((0.3 + 0.004 * S.bilHV) * 10) / 10, [0.2, 4.0, 0.1], null, "Interlayer insulation in the HV coil, from the volts per layer.");
  /* CALIBRATION.md, radial cooling duct thresholds. ENGINE_VERSION 1.8.0:
     the old LV rule keyed off total radial thickness (>22 mm), which put a
     duct inside a compact single-layer LV bundle that never had one -- the
     1250 kVA sheet's own insulation list places its ducts outside the LV
     coil, in the LV-HV gap this engine already models as lvHvClr; the LV
     bundle itself is solid. A duct exists to let a strand's own heat escape
     without conducting through every other strand radially outward from
     it, so what matters is how many radial layers deep the stack is, not
     how many millimetres that happens to be -- a single 6-strand radial
     stack is 40 mm thick and cools from both faces same as a thin one;
     four layers of the same conductor is a real barrier regardless of how
     thin each layer is. Same reasoning applied to the HV rule, which was
     already layer-based (floor(layers/6), capped at 2) but at a much
     higher threshold -- not confirmed against either reference sheet
     either way, since both references' HV layer counts (12 and 13) sit
     at or past ductLayers2 under both the old and the new default, so
     this change does not move either reference's HV duct count. */
  put("ductLayers1", 2, [1, 10, 1], null, "Radial layers of the same conductor before the first cooling duct appears.");
  put("ductLayers2", 4, [2, 20, 1], null, "Radial layers before a second cooling duct appears.");
  put("ductWidth", 6, [3, 12, 1], null, "Width added per radial cooling duct.");
  put("insFactor", 4.5, [2.5, 7.0, 0.1], null, "Multiplier that converts the cylinder volume into total insulation mass.");
  put("topOilSpace", dry ? 300 : Math.round(150 + 0.8 * S.bilHV), [100, 500, 10], null, "Space above the core for leads, the top oil level and the cover.");
  put("bottomClr", 60, [30, 150, 5], null, "Core bottom frame to tank floor.");
  put("finDiss", 250, [180, 400, 10], null, "Fin or radiator dissipation at 50 K rise. Calibrate it from your own heat-run results.");
  put("tankDiss", 300, [200, 450, 10], null, "Plain tank wall dissipation at 50 K rise.");
  /* CALIBRATION.md section 20: converts the extra cooling surface forcing
     buys (finAreaReq x (forcedMul-1), the area a natural design would have
     needed beyond what forcing actually requires) into a fan count for the
     BOM. Not sourced from any fan manufacturer's catalogue -- there is no
     textbook figure for this the way there is for a dissipation law -- so
     it is fitted as a round, clearly-labelled placeholder and left in the
     same "fitted, override with your own data" category as finDiss and
     tankDiss above, not presented as a supplier spec. */
  put("fanUnitArea", 3.0, [1.5, 8.0, 0.5], null, "Effective cooling surface one fan services, m². A fitted placeholder, not a catalogue figure -- override once your own fan supplier's air-delivery data is known.");
  put("airDiss", 3.2, [2.0, 5.0, 0.1], null, "Dry-type coil surface dissipation coefficient.");

  /* --- economics --- */
  put("tariff", 8.0, [3, 15, 0.25], null, "Energy tariff used to value the losses over the life.");
  put("years", 20, [5, 35, 1], null, "Evaluation period for the cost of ownership.");
  put("loadFactor", 0.60, [0.2, 1.0, 0.05], null, "Average loading. Load loss scales with the square of this.");
  put("pf", 1.0, [0.7, 1.0, 0.05], null, "Power factor used for efficiency and regulation.");

  /* CALIBRATION.md section 9: the second costing model's own Extra line
     (insulation & fitting, bushing & metal parts, labour and everything
     else that has no per-kg driver). Never derived -- AUTO is 0, not a
     formula, and stays 0 until the estimator enters their own figure, the
     same way the sheet this model reproduces treats it as one judged
     number, not a calculation. */
  put("cardExtra", 0, [0, 500000, 5000], null, "Insulation & fitting, bushing & metal parts and labour, as one figure -- not derived. Enter what the works would actually charge here.");

  return { S, SUG, RNG, OPT, NOTE };
}

/* core, condCu, frameMS, tankMS and fluid taken from the 630 kVA Level 1
   costing sheet (CALIBRATION.md, "DEFAULT_RATES" section), 2026-08-11.
   Everything else in this object is unchanged -- not confirmed against
   that sheet, and not touched on the strength of five figures from one
   document. This is the engineering-default rate card only, the lowest
   tier of the price-source hierarchy (src/lib/pricing.ts): any project
   with its own rate card or item-master prices never reads this.

   CALIBRATION.md section 33/36: condAl and condCca were both flagged
   UNSOURCED here -- every Fit to Budget search this project had run, at
   every rating, recommended aluminium or CCA over sheet-confirmed copper
   by 73-96%, entirely on the strength of two numbers nobody had checked.
   Resolved differently for each. condAl is now sourced: the designer's own
   supplier range is Rs 380-420/kg, set at 400 -- searchDesigns no longer
   excludes it (see UNSOURCED_RATE_KEYS below). condCu's own 1415 is
   confirmed against the same designer range (Rs 1350-1450). condCca stays
   at its old unsourced placeholder, but the reason it is excluded from the
   search changed: CCA physically contains copper and costs more to produce
   than plain aluminium, so 40% of the copper rate was never plausible on
   its own terms -- but the real reason it does not belong in a
   recommendation is that standard manufacturers do not buy it at all
   (MATERIALS_EXCLUDED_FROM_SEARCH below, CALIBRATION.md section 36). No
   rate would fix that; the number here is left unchanged only because
   nothing reads it for pricing purposes any more. */
const DEFAULT_RATES = {
  core: 240, condCu: 1415, condAl: 400, condCca: 560, insulation: 385,
  frameMS: 70, tankMS: 86, fin: 152, radiator: 168, fluid: 115,
  paint: 340, bushHV: 2400, bushLV: 1900, octc: 9500, oltc: 465000, dualLink: 12000,
  cableBox: 18000, fittings: 26000, plateSet: 3500, resin: 380, enclosure: 155,
  labWind: 65, labCore: 22, labTank: 34, assembly: 42000,
  overheadPct: 12, scrapPct: 2.5, freight: 22000, marginPct: 11, gstPct: 18,
  /* CALIBRATION.md section 20: cooling fans, oil pumps and their control
     gear are bought components with no per-kg or per-m² basis anywhere else
     in this rate card to anchor a starting figure on, unlike core/condCu/
     tankMS (commodity rates) or even octc/oltc/fittings (accessory rates
     this project's own past costing sheets gave a figure for). There is no
     such sheet for these three. Left at 0, not a guessed market price --
     every ONAF/OFAF/ODAF BOM will price these lines at zero until a real
     quote is entered in the rate card, which is deliberate: a visible zero
     is a prompt to enter the rate, a plausible-looking nonzero one would
     not be. */
  coolingFan: 0, oilPump: 0, coolingControlGear: 0,
};

/* ---------------- Formatting ---------------- */
const inr = (n) => "\u20B9" + Math.round(n || 0).toLocaleString("en-IN");
const lakhs = (n) => { const v = n || 0; return Math.abs(v) >= 1e7 ? (v / 1e7).toFixed(2) + " Cr" : (v / 1e5).toFixed(2) + " L"; };
const f1 = (n) => (n || 0).toFixed(1);
const f2 = (n) => (n || 0).toFixed(2);
const f3 = (n) => (n || 0).toFixed(3);
const f0 = (n) => Math.round(n || 0);

/* ============================================================
   DESIGN ENGINE
   ============================================================ */

function designTransformer(p) {
  const grade = CORE_GRADES[p.coreGrade] || CORE_GRADES.m4;
  const ct = CORE_TYPES[p.coreType] || CORE_TYPES.stepLap;
  const std = STANDARDS[p.standard] || STANDARDS.IS;
  const dry = p.medium === "dry";
  const fluid = FLUIDS[p.fluid] || FLUIDS.mineral;
  const dryT = DRY_TYPES[p.dryType] || DRY_TYPES.castResin;
  const cls = INS_CLASS[p.insClass] || INS_CLASS.A;
  const B = Math.min(p.flux, grade.bMax);
  const cLV = CONDUCTORS[p.condLV], cHV = CONDUCTORS[p.condHV];
  const dLV = Math.min(p.deltaLV, cLV.dMax), dHV = Math.min(p.deltaHV, cHV.dMax);
  const clr = p;
  const cylThk = p.cylThk || 3;

  const refT = dry ? cls.ref : p.refTemp;
  const rho = (c) => c.rho20 * (1 + c.alpha * (refT - 20));

  const hvConn = (p.vector[0] || "D").toUpperCase();
  const lvConn = (p.vector[1] || "y").toLowerCase();
  const R3 = Math.sqrt(3);

  const hvDesign = p.dualHV ? Math.max(p.hv, p.hv2) : p.hv;
  const hvCurrent = p.dualHV ? Math.min(p.hv, p.hv2) : p.hv;
  const lvDesign = p.dualLV ? Math.max(p.lv, p.lv2) : p.lv;
  const lvCurrent = p.dualLV ? Math.min(p.lv, p.lv2) : p.lv;

  const hvPh = hvConn === "D" ? hvDesign : hvDesign / R3;
  const lvPh = lvConn === "y" ? lvDesign / R3 : lvDesign;
  const iLineHV = (p.kva * 1000) / (R3 * hvCurrent);
  const iLineLV = (p.kva * 1000) / (R3 * lvCurrent);
  const iHV = hvConn === "D" ? iLineHV / R3 : iLineHV;
  const iLV = lvConn === "y" ? iLineLV : iLineLV / R3;

  const etTrial = p.etK * Math.sqrt(p.kva);
  const nLV = Math.max(1, Math.round(lvPh / etTrial));
  const et = lvPh / nLV;
  const nHV = Math.max(1, Math.round((nLV * hvPh) / lvPh));
  const nHVmax = Math.round(nHV * (1 + p.tapPlus / 100));
  const tapSteps = Math.round((p.tapPlus + p.tapMinus) / Math.max(0.01, p.tapStep)) + 1;
  const ratioErr = ((nHV / nLV) * (lvPh / hvPh) - 1) * 100;
  const turnsPerStep = (nHV * p.tapStep) / 100;

  /* core cross-section */
  const aNet = et / (4.44 * p.freq * B);
  const aGross = aNet / grade.sf;
  let dCore, coreW, coreD;
  const shape = ct.shape;
  if (shape === "circ") {
    const util = STEP_UTIL[p.steps] || 0.94;
    dCore = Math.sqrt((4 * aNet) / (Math.PI * util * grade.sf)) * 1000;
    coreD = dCore; coreW = dCore;
  } else {
    coreD = Math.sqrt(aNet / (ct.aspect * grade.sf)) * 1000;
    coreW = ct.aspect * coreD;
    dCore = coreD;
  }
  const perim = (t) => (shape === "circ" ? Math.PI * (dCore + 2 * t) : 2 * (coreW - coreD) + Math.PI * (coreD + 2 * t));

  const aLVreq = iLV / dLV;
  const aHVreq = iHV / dHV;
  const T_MIN = 0.4;

  /* ---- everything that depends on the window height ---- */
  const build = (Hw) => {
    const hLV = Math.max(100, Hw - 2 * clr.endClrLV);
    const hHV = Math.max(100, Hw - 2 * clr.endClrHV);

    /* LV: a single conductor (full-height foil, or a thin T_MIN strip with
       several turns sharing an axial pass) below p.lvFoilMaxKva -- the
       original model, unchanged. At or above it, LV multi-layer strip
       construction: the turn's own required cross-section is split into
       axCount x radCount parallel conductors, the same practical-strand
       idea conductorSchedule already uses for HV, repeated across however
       many radial winding layers the turn count needs to fit axially.
       Both branches populate the same five outputs so the radial-build
       formula below never needs to know which one ran -- axCount = radCount
       = 1 in the single-conductor branch reduces it to exactly the old
       formula. */
    let foilW, tLV, lvTurnLayers, lvAxCount, lvRadCount;
    if (p.kva < p.lvFoilMaxKva) {
      const wFull = Math.max(20, hLV - 10);
      if (aLVreq / wFull >= T_MIN) {
        foilW = wFull; tLV = aLVreq / wFull; lvTurnLayers = nLV;
      } else {
        tLV = T_MIN; foilW = aLVreq / T_MIN;
        const perAxial = Math.max(1, Math.floor(hLV / (foilW + 2)));
        lvTurnLayers = Math.ceil(nLV / perAxial);
      }
      lvAxCount = 1; lvRadCount = 1;
    } else {
      /* CALIBRATION.md: axCount is what hLV can physically hold, not a
         fixed ratio of n -- axial strands must all fit inside the coil
         height (times nLV, since every turn needs the same axial room if
         they are to share one radial layer, the arrangement both
         reference sheets actually use); radial strands are limited only
         by build depth, so radCount simply absorbs whatever n does not
         fit axially. This is the inversion the old aspect-ratio split
         missed: that formula's axCount:radCount reduced algebraically to
         the aspect constant alone, at every n, so it could never shift
         toward more-radial as current (and so n) rises the way a real
         designer does. No separate strand aspect ratio is needed any
         more -- the strand is sized square from its own share of aLVreq,
         and lvStripAspect is retired (see its own former put() note,
         removed here, not superseded elsewhere).
         Strand size depends on the split and the split depends on strand
         size, so this seeds axCount from an area-only estimate (n's own
         average strip area, ignoring the eventual axCount/radCount
         rounding) rather than iterating to a fixed point -- confirmed
         against both reference sheets exactly, see reference-designs.test.mjs. */
      let n = Math.max(1, Math.ceil(aLVreq / p.lvStripMaxMM2));
      const sideEst = Math.sqrt(aLVreq / n);
      lvAxCount = Math.max(1, Math.min(n, Math.floor(hLV / ((sideEst + p.lvStripGap) * nLV))));
      lvRadCount = Math.max(1, Math.ceil(n / lvAxCount));
      n = lvAxCount * lvRadCount;
      const stripArea = aLVreq / n;
      tLV = Math.sqrt(stripArea);
      foilW = Math.sqrt(stripArea);
      const turnAxialWidth = lvAxCount * (foilW + p.lvStripGap);
      const perAxial = Math.max(1, Math.floor(hLV / turnAxialWidth));
      lvTurnLayers = Math.ceil(nLV / perAxial);
    }
    let lvRadial = lvTurnLayers * lvRadCount * (tLV + p.lvIns);
    const lvDucts = lvTurnLayers >= p.ductLayers2 ? 2 : lvTurnLayers >= p.ductLayers1 ? 1 : 0;
    lvRadial += lvDucts * p.ductWidth;

    /* HV: layer, crossover or disc winding, selected by p.hvConstruction
       (MANUFACTURING.md section 5). Conductor size (axHV, rdHV) does not
       depend on construction, only how it is arranged does.

       Unified model: nHVmax turns fill "groups" stacked axially (a layer
       winding's whole coil is one group; a crossover winding is several
       coils, each its own group; a disc winding is many discs, each its
       own group). Within a group, groupTurns turns stack axially per
       radial layer, and layers stack radially exactly as a plain layer
       winding already did -- layer construction is the special case
       numGroups = 1, groupTurns solved from the window height, which
       reduces these formulas to exactly what they were before this
       section existed. Groups themselves stack axially with groupGap
       between them, so numGroups responds to the window-height bisection
       the same way turnsPerLayer always has for a plain layer winding.

       - Crossover: groupTurns is a practical, fixed axial turn count per
         coil (p.hvCrossoverTurnsPerLayer, default 10) -- kept small so
         each coil stays easy to wind and handle. Together with
         p.hvCoilGap (default 20 mm), this reproduces the 630 kVA dry
         reference's 6 coils of 13 layers of 10 turns almost exactly.
       - Disc: groupTurns = 1 (a disc's turns stack radially, not axially,
         so each "layer" here is one turn and the disc's own axial extent
         is one conductor deep). numGroups (disc count) and groupGap
         (p.hvDiscGap, default 4.5 mm) are what determine how many discs
         the window height holds; turns per disc then falls out of that,
         rather than being fixed independently -- there is no clean
         first-principles driver for it at this BIL class (dielectric
         grading would allow a far higher figure). p.hvDiscGap reproduces
         the 1250 kVA reference's 44 discs almost exactly; see its own
         put() note for why it isn't simply the sheet's stated 97.5 mm
         over 43 gaps. */
    /* CALIBRATION.md section 41: axHV/rdHV are ONE strand's own dimensions,
       same meaning as before -- but above HV_STRAND_MAX_MM2, aHVreq is now
       split into hvAxCount x hvRdCount parallel strands the same way
       conductorSchedule has always displayed (same formula, moved here so
       there is only one place it is computed, not two that can disagree).
       hvTurnAx/hvTurnRd are what a whole TURN actually occupies -- every
       parallel strand stacked with its own covering, not one strand's
       footprint standing in for all of them. These, not axHV/rdHV plus one
       hvPaper, are what the group/layer count and the radial build below
       use: the window-height solve, tank sizing and (through the mean turn
       length this radial build feeds) load loss all previously sized
       themselves against a single conductor's footprint regardless of how
       many actually run in parallel. */
    let axHV, rdHV, hvAxCount, hvRdCount;
    if (aHVreq > HV_STRAND_MAX_MM2) {
      const hvAspect = 2.1;
      let n = Math.ceil(aHVreq / HV_STRAND_MAX_MM2);
      hvRdCount = Math.max(1, Math.round(Math.sqrt(n / hvAspect)));
      hvAxCount = Math.ceil(n / hvRdCount);
      n = hvAxCount * hvRdCount;
      const strandArea = aHVreq / n;
      rdHV = Math.sqrt(strandArea / hvAspect);
      axHV = hvAspect * rdHV;
    } else {
      hvAxCount = 1; hvRdCount = 1;
      if (aHVreq > 6) { rdHV = Math.sqrt(aHVreq / 2.1); axHV = 2.1 * rdHV; }
      else { const dia = Math.sqrt((4 * aHVreq) / Math.PI); axHV = dia; rdHV = dia; }
    }
    /* CALIBRATION.md section 41: every parallel strand gets its own full
       covering allowance, the same convention LV's own multi-strand split
       already uses (lvRadial = lvTurnLayers * lvRadCount * (tLV + lvIns),
       every strand counted, not gaps between them) -- reused here for
       consistency within this engine, not independently confirmed for HV
       multi-strand practice. Real construction may use a lighter
       inter-strand covering than a full outer wrap on each strand; there
       is no reference sheet with a multi-strand HV winding to check
       against (both existing references stay under HV_STRAND_MAX_MM2,
       single strand). Flagged, not guessed past. */
    const hvTurnAx = hvAxCount * (axHV + p.hvPaper);
    const hvTurnRd = hvRdCount * (rdHV + p.hvPaper);

    let groupTurns, groupGap, numGroups;
    if (p.hvConstruction === "crossover") {
      groupTurns = Math.max(1, Math.round(p.hvCrossoverTurnsPerLayer));
      groupGap = p.hvCoilGap;
      numGroups = Math.max(1, Math.floor((hHV + groupGap) / (groupTurns * hvTurnAx + groupGap)));
    } else if (p.hvConstruction === "disc") {
      groupTurns = 1;
      groupGap = p.hvDiscGap;
      numGroups = Math.max(2, Math.floor((hHV + groupGap) / (hvTurnAx + groupGap)));
    } else {
      groupTurns = Math.max(1, Math.floor(hHV / hvTurnAx));
      groupGap = 0;
      numGroups = 1;
    }
    const turnsPerLayer = groupTurns;
    const layers = Math.max(1, Math.ceil(nHVmax / (numGroups * groupTurns)));
    const hvDucts = layers >= p.ductLayers2 ? 2 : layers >= p.ductLayers1 ? 1 : 0;
    const hvRadial = layers * hvTurnRd + (layers - 1) * p.hvInterlayer + hvDucts * p.ductWidth;

    const tLVin = clr.coreLvClr, tLVout = tLVin + lvRadial;
    const tHVin = tLVout + clr.lvHvClr, tHVout = tHVin + hvRadial;
    const lvID = dCore + 2 * tLVin, lvOD = dCore + 2 * tLVout;
    const hvID = dCore + 2 * tHVin, hvOD = dCore + 2 * tHVout;
    const cc = (shape === "circ" ? hvOD : coreD + 2 * tHVout) + clr.phaseClr;
    const Ww = cc - dCore;
    const lmtLV = (perim(tLVin) + perim(tLVout)) / 2 / 1000;
    const lmtHV = (perim(tHVin) + perim(tHVout)) / 2 / 1000;

    const rLV = (rho(cLV) * (nLV * lmtLV)) / aLVreq;
    const rHV = (rho(cHV) * (nHV * lmtHV)) / aHVreq;
    const i2rLV = 3 * iLV * iLV * rLV, i2rHV = 3 * iHV * iHV * rHV;
    const loadLoss = (i2rLV + i2rHV) * (1 + p.stray / 100);

    const lmtMean = (perim((tLVin + tLVout) / 2) + perim((tHVin + tHVout) / 2)) / 2 / 1000;
    const dEff = (clr.lvHvClr + (lvRadial + hvRadial) / 3) / 1000;
    const hEff = (Math.min(hLV, hHV) / 1000) * 0.95;
    const X = (2 * Math.PI * p.freq * 4e-7 * Math.PI * nLV * nLV * lmtMean * dEff) / hEff;
    const pctX = ((X * iLV) / lvPh) * 100;
    const pctR = (loadLoss / (p.kva * 1000)) * 100;
    return {
      Hw, hLV, hHV, foilW, tLV, lvRadial, axHV, rdHV, turnsPerLayer, layers, hvRadial,
      lvTurnLayers, hvDucts, dEff, hEff, X, lmtMean, tLVin, tLVout, tHVin, tHVout,
      lvID, lvOD, hvID, hvOD, cc, Ww, lmtLV, lmtHV, rLV, rHV, i2rLV, i2rHV, loadLoss,
      pctX, pctR, pctZ: Math.sqrt(pctX * pctX + pctR * pctR),
      voltsPerLayer: et * turnsPerLayer,
      numGroups, groupGap,
      lvAxCount, lvRadCount, hvAxCount, hvRdCount,
    };
  };

  /* starting window height from the output equation */
  const Kw = p.windowSpace / (30 + hvDesign / 1000);
  const dAvg = ((dLV + dHV) / 2) * 1e6;
  const aWin = (p.kva * 1000) / (3.33 * p.freq * B * aNet * dAvg * Kw);
  const Hw0 = Math.max(200, Math.sqrt(aWin / p.aspect) * p.aspect * 1000);

  /* solve the window height for the declared impedance: taller window, lower reactance */
  let g = build(Hw0), solvedZ = false;
  if (p.autoWindow !== false && p.targetZ > 0) {
    let lo = 0.35 * Hw0, hi = 6 * Hw0;
    if (build(hi).pctZ <= p.targetZ && build(lo).pctZ >= p.targetZ) {
      for (let i = 0; i < 44; i++) {
        const mid = (lo + hi) / 2;
        if (build(mid).pctZ > p.targetZ) lo = mid; else hi = mid;
      }
      g = build((lo + hi) / 2);
      solvedZ = true;
    } else {
      g = build(build(lo).pctZ < p.targetZ ? lo : hi);
    }
  }
  const Hw = g.Hw;

  /* weights */
  const wLV = 3 * nLV * g.lmtLV * aLVreq * 1e-6 * cLV.dens;
  const wHV = 3 * nHVmax * g.lmtHV * aHVreq * 1e-6 * cHV.dens;
  /* Covered conductor weight, additive alongside the bare figures above --
     the detailed BOM still prices bare copper/aluminium and is unchanged.
     LV: p.lvIns sits once per (turn-layer x radCount) radial position, the
     same geometry lvRadial already builds from (line ~584), so the extra
     area per elementary conductor is foilW x lvIns, not lvIns added to the
     axial dimension -- there is no covering on that edge. HV: p.hvPaper is
     already documented as the full "on diameter" addition, applied per
     STRAND now (CALIBRATION.md section 41) -- covered area is
     hvAxCount*hvRdCount strands, each (axHV+hvPaper)(rdHV+hvPaper), against
     the single full-section aHVreq, the same split conductorSchedule
     displays and build()'s own hvTurnAx/hvTurnRd size the winding from, not
     a second, disagreeing count. Paper/pressboard density 1150 kg/m^3 is
     the same figure wIns already uses for cylinder insulation, not a new
     constant. */
  const wLVCovered = wLV + 3 * nLV * g.lmtLV * (g.lvAxCount * g.lvRadCount * g.foilW * p.lvIns) * 1e-6 * 1150;
  const hvN = g.hvAxCount * g.hvRdCount;
  const wHVCovered = wHV + 3 * nHVmax * g.lmtHV * (hvN * (g.axHV + p.hvPaper) * (g.rdHV + p.hvPaper) - aHVreq) * 1e-6 * 1150;
  const yokeDepth = shape === "circ" ? 0.86 * dCore : coreD;
  /* CALIBRATION.md section 15: the limb term used to be aGross x 3 x Hw,
     treating every lamination as if it ran the full window height
     regardless of step -- but a mitred-both-ends limb lamination's own
     length is 2 x width (coreCuttingChart's own Plate A, drawing 22,
     validated against a real cut plate to -1.4%), not Hw. This is not two
     separate models: it is the same per-step, snapped-width computation
     Plate A already does (same stepWidths call, same p.stepIncrement real
     slit stock uses), so wCore and the cutting chart agree on the limb by
     construction, not by coincidence. The yoke term is untouched -- it
     already matched Plate B + Plate C to within 0.5 kg on the one
     reference checked, so there was nothing there to fix. */
  const coreSteps = stepWidths(p.steps, dCore, p.stepIncrement);
  const lamThk = grade.thk || 0.27;
  let wLimb, wYoke;
  if (p.coreConstruction === "B") {
    // CALIBRATION.md section 35: same function coreCuttingChart() calls for
    // Construction B's own drawing, so the priced core and the steel-order
    // document always agree on the same core, the same principle section
    // 15 established for Construction A's own limb term.
    const cb = coreConstructionB(dCore, g.cc, Hw, coreSteps, lamThk);
    wYoke = cb.totalV;
    wLimb = cb.totalO + cb.totalC;
  } else {
    wLimb = 0;
    coreSteps.rows.forEach((s, i) => {
      const stack = i === 0 ? s.t : 2 * s.t;
      const nSheets = Math.max(2, Math.round(stack / lamThk));
      const lenA = 2 * s.w;
      wLimb += ((s.w * lenA * lamThk) / 1e9) * 7650 * nSheets * 3; // 3 limbs
    });
    wYoke = aGross * 2 * ((2 * g.cc + (shape === "circ" ? dCore : coreD)) / 1000) * 7650;
  }
  const wCore = wLimb + wYoke;
  const coreHeight = Hw + 2 * yokeDepth;
  const coreWidth = 2 * g.cc + (shape === "circ" ? dCore : coreD);

  const cylVol = 3 * ((perim(clr.coreLvClr) / 1000) * (g.hLV / 1000) * ((cylThk * 0.8) / 1000)
    + (perim(clr.coreLvClr + g.lvRadial) / 1000) * (g.hHV / 1000) * (cylThk / 1000));
  const wIns = cylVol * 1150 * p.insFactor;
  const wFrame = 0.11 * wCore;

  /* losses */
  const wPerKg = grade.wRef * Math.pow(B / grade.bRef, 1.9) * p.buildFactor;
  const noLoad = wPerKg * wCore;
  const vaPerKg = grade.vaRef * Math.pow(B / grade.bRef, 4.0) * ct.exc;
  const i0pct = ((vaPerKg * wCore) / (p.kva * 1000)) * 100;
  const loadLoss = g.loadLoss;
  const totalLoss = noLoad + loadLoss;
  const regFull = g.pctR * p.pf + g.pctX * Math.sqrt(Math.max(0, 1 - p.pf * p.pf));

  /* thermal */
  const grad = 2.4 * Math.pow((dLV + dHV) / 2, 2) * (p.condLV === "aluminium" ? 1.12 : 1.0);
  const riseLimit = dry ? cls.rise : Math.min(std.oilRise, fluid.riseLimit);
  const wRiseLimit = dry ? cls.rise : Math.min(std.windRise, fluid.wRiseLimit);

  let tankL = 0, tankW = 0, tankH = 0, tankArea = 0, finAreaReq = 0, wTank = 0, wFin = 0;
  let fluidLitres = 0, oilRise = 0, windRise = 0, coilArea = 0, wEnclosure = 0;
  let kTank = 0, kFin = 0, tankDissip = 0, riseTarget = 0, forcedMul = 1;
  let fanCount = 0, pumpCount = 0;
  let dualForced = 0, dualLoadLoss = 0, dualTotalLoss = 0, dualAreaReq = 0, dualOilRise = 0, dualWindRise = 0;

  /* Tank length must clear the outer limbs' own coil envelope, not their
     bare core. coreWidth (2*cc + dCore) stops at the core surface, so
     building the end allowance from it left the outer limbs' HV coil
     overhanging the end wall with none of the declared endTankClr actually
     free -- confirmed against the longitudinal cross-section drawing, off
     by ~10 mm on the golden case with zero clearance instead of 74 mm.
     g.cc already includes phaseClr beyond the coil envelope
     (cc = coilAcross + phaseClr), so subtracting it back out gives the
     true one-limb coil width to build the end allowance from -- the same
     quantity tankW already correctly uses (as hvOD) for the side walls.
     Fixed in ENGINE_VERSION 1.1.0; see engine.test.mjs for the
     golden-number note. */
  const coilAcross = g.cc - clr.phaseClr;

  if (!dry) {
    tankL = 2 * g.cc + coilAcross + 2 * clr.endTankClr;
    tankW = (shape === "circ" ? g.hvOD : coreW + 2 * (clr.coreLvClr + g.lvRadial + clr.lvHvClr + g.hvRadial)) + 2 * clr.hvTankClr;
    tankH = coreHeight + p.bottomClr + p.topOilSpace;
    tankArea = (2 * (tankL + tankW) * tankH) / 1e6;
    const capArea = (2 * tankL * tankW) / 1e6;
    kTank = (p.tankDiss * fluid.dissMul) / Math.pow(50, 1.25);
    kFin = (p.finDiss * fluid.dissMul) / Math.pow(50, 1.25);
    // ODAF is given OFAF's 2.1 multiplier as a known simplification: directed
    // oil flow raises the film coefficient at the winding surface, which this
    // engine does not model separately from the forced-air-over-radiator
    // effect that already drives OFAF's figure. Revisit if a directed-flow
    // design is ever actually costed, not just declared.
    const forced = p.cooling === "ONAF" ? 1.5 : p.cooling === "OFAF" || p.cooling === "ODAF" ? 2.1 : 1.0;
    forcedMul = forced;
    /* the cooling surface must satisfy the top-oil limit AND the winding limit */
    const target = Math.max(20, Math.min(p.oilRiseTarget, riseLimit, (wRiseLimit - grad) / 0.8));
    riseTarget = target;
    tankDissip = kTank * tankArea * Math.pow(target, 1.25);
    finAreaReq = Math.max(0, (totalLoss - tankDissip) / (kFin * forced * Math.pow(target, 1.25)));

    /* CALIBRATION.md section 21: dual rating (optional, off by default).
       The active part above (turns, conductor area, current density) is
       sized to p.kva/p.cooling alone, unchanged. Only the fin area changes:
       it must satisfy BOTH points' own rise limit at BOTH points' own loss
       and forced multiplier, not just the primary's -- tankDissip and
       target are shared (same tank, same standard, same fluid), only the
       loss and forced multiplier differ between the two checks. Load loss
       scales with current squared for the same winding; no-load loss does
       not change, the core and flux are the same core regardless of which
       name-plate figure is being carried. This is not always the
       higher-loss point that binds -- a lower forced multiplier can need
       more raw area even at a lower loss -- so both are actually computed,
       not assumed. */
    dualForced = p.dualRating && p.kva2 > 0
      ? (p.cooling2 === "ONAF" ? 1.5 : p.cooling2 === "OFAF" || p.cooling2 === "ODAF" ? 2.1 : 1.0) : 0;
    if (p.dualRating && p.kva2 > 0) {
      dualLoadLoss = loadLoss * Math.pow(p.kva2 / p.kva, 2);
      dualTotalLoss = noLoad + dualLoadLoss;
      dualAreaReq = Math.max(0, (dualTotalLoss - tankDissip) / (kFin * dualForced * Math.pow(target, 1.25)));
      finAreaReq = Math.max(finAreaReq, dualAreaReq);
    }

    oilRise = Math.pow(totalLoss / (kTank * tankArea + kFin * forced * finAreaReq), 1 / 1.25);
    wFin = (finAreaReq / 2) * 0.0012 * 7850 * (p.tankType === "fin" ? 1.18 : 1.55);
    const tPlate = p.kva > 2500 ? 0.006 : 0.005;
    wTank = (tankArea * tPlate + capArea * (tPlate + 0.001)) * 7850 * 1.28;
    const tankVol = (tankL * tankW * tankH) / 1e9;
    const activeVol = wCore / 7650 + wLV / cLV.dens + wHV / cHV.dens + wIns / 1150 + wFrame / 7850;
    fluidLitres = Math.max(30, (tankVol - activeVol) * 1000 * (p.tankType === "fin" ? 1.10 : 1.22));
    windRise = 0.8 * oilRise + grad;
    if (p.dualRating && p.kva2 > 0) {
      dualOilRise = Math.pow(dualTotalLoss / (kTank * tankArea + kFin * dualForced * finAreaReq), 1 / 1.25);
      dualWindRise = 0.8 * dualOilRise + grad;
    }

    /* CALIBRATION.md section 20: fan count from the cooling surface actually
       required and the forced multiplier, not a fixed number -- forcedMul-1
       is the fraction of finAreaReq's dissipation that forcing itself is
       contributing (at forcedMul=1, ONAN, this is 0 and fanCount is 0).
       p.fanUnitArea is a fitted placeholder (see its own put() note above),
       not a catalogue figure. ONAF, OFAF and ODAF are all air-forced (the
       "AF" in each name) and so all carry fans; OFAF and ODAF additionally
       direct/force the oil itself and so also carry a pump -- fans and pump
       are independent lines, not alternatives. */
    fanCount = forced > 1 ? Math.max(1, Math.ceil((finAreaReq * (forced - 1)) / p.fanUnitArea)) : 0;
    pumpCount = p.cooling === "OFAF" || p.cooling === "ODAF" ? 1 : 0;
  } else {
    const t1 = clr.coreLvClr, t2 = t1 + g.lvRadial, t3 = t2 + clr.lvHvClr, t4 = t3 + g.hvRadial;
    coilArea = 3 * ((perim(t1) + perim(t2)) * g.hLV + (perim(t3) + perim(t4)) * g.hHV) / 1e6;
    const forced = p.cooling === "AF" ? 1.55 : 1.0;
    windRise = Math.pow(totalLoss / (p.airDiss * coilArea * 1.35 * forced), 0.8);
    tankL = 2 * g.cc + coilAcross + 300;
    tankW = (shape === "circ" ? g.hvOD : coreW + 2 * t4) + 320;
    tankH = coreHeight + 420;
    wEnclosure = ((2 * (tankL + tankW) * tankH + 2 * tankL * tankW) / 1e6) * 0.0016 * 7850;
  }

  const hotspot = p.ambient + (dry ? windRise + 1.1 * grad : oilRise + 1.3 * grad);
  const hotspotAvg = (p.ambientAvg ?? 32) + (dry ? windRise + 1.1 * grad : oilRise + 1.3 * grad);
  const lifeRef = dry ? 98 + (cls.ref - 75) : 98;
  const lifeFactor = Math.pow(2, (lifeRef - hotspotAvg) / 6);

  const out = p.kva * 1000 * p.pf;
  const effAt = (k) => ((k * out) / (k * out + noLoad + loadLoss * k * k)) * 100;
  const maxEffLoad = Math.sqrt(noLoad / Math.max(1, loadLoss));
  const iscMult = 100 / g.pctZ;
  const noise = 39 + 12.5 * Math.log10(Math.max(1, p.kva / 100)) + (B - 1.6) * 28 + grade.noise + (dry ? 4 : 0);

  /* p.limitNLL/limitLL are always the single source of truth here, not
     just when effLevel is "custom": deriveSpec's put("limitNLL", ...) sets
     them from lossSchedule(kva, effLevel, dry) for every level, AND lets an
     explicit over.limitNLL/limitLL replace that suggestion regardless of
     which level is selected -- the whole point of typing a guaranteed
     figure into the enquiry is that it binds, not only when the level
     dropdown happens to say "Custom". Re-deriving sch from lossSchedule()
     fresh here, gated on effLevel, silently ignored that override: a
     reference reproduction giving its own limitNLL/limitLL with effLevel
     left at "level2" (the common case, since nobody re-labels a real
     enquiry's level just to enter its own guaranteed figures) was checked
     for compliance against the engine's own auto schedule instead of the
     figure actually entered. searchDesigns' and fitEtkToCost's own
     compliance.nll/ll.ok checks inherit this fix for free, since both read
     it from here rather than re-deriving it themselves. */
  const sch = { nll: p.limitNLL, ll: p.limitLL };
  /* g.pctZ (impedance as designed, %) is referenced to p.kva's own current
     -- %Z = I_rated x Z_ohms / V_rated, and I_rated scales with kVA at
     fixed voltage, so the SAME winding genuinely has a different %Z figure
     at a different rating, not just a different loss. For a dual-rated
     design this means there is a second, real impedance value at kva2's
     own current that this engine does not compute -- unlike the fin-area
     solve, this was never asked for and is not implemented (CALIBRATION.md
     section 22, recorded as a known gap, not silently absent). Do not
     read dualCompliance as covering this: it only carries the thermal and
     loss checks the fin-area solve actually produces. */
  const compliance = {
    nll: { val: noLoad, lim: sch.nll, ok: noLoad <= sch.nll },
    ll: { val: loadLoss, lim: sch.ll, ok: loadLoss <= sch.ll },
    total: { val: totalLoss, lim: sch.nll + sch.ll, ok: totalLoss <= sch.nll + sch.ll },
    z: { val: g.pctZ, lim: p.targetZ, ok: Math.abs(g.pctZ - p.targetZ) / p.targetZ <= Math.min(p.zTol, std.zTol) / 100 },
    rise: { val: dry ? windRise : oilRise, lim: riseLimit, ok: (dry ? windRise : oilRise) <= riseLimit + 0.5 },
    wRise: { val: windRise, lim: wRiseLimit, ok: windRise <= wRiseLimit + 0.5 },
    ratio: { val: Math.abs(ratioErr), lim: 0.5, ok: Math.abs(ratioErr) <= 0.5 },
    volley: { val: g.voltsPerLayer, lim: p.acHV * 1000 * 0.6, ok: g.voltsPerLayer * 2 <= p.acHV * 1000 * 0.6 },
    // CALIBRATION.md section 44 (was section 28's window-aspect ratio, a
    // proxy for the same thing): a design can satisfy impedance, thermal
    // and the loss schedule with a coil or tank the shop cannot actually
    // build or move -- see section 28's own K=0.32 case, a 1.28-1.45 m LV
    // coil on a 630-1000 kVA distribution job, more than double the real
    // reference designs' own 595-633 mm. These two check the real physical
    // limits directly instead of the ratio that used to stand in for them.
    coilHeight: { val: Math.max(g.hLV, g.hHV), lim: p.coilHeightLimit, ok: Math.max(g.hLV, g.hHV) <= p.coilHeightLimit },
    tankHeight: { val: tankH, lim: p.tankHeightLimit, ok: tankH <= p.tankHeightLimit },
  };
  const compliant = Object.values(compliance).every((x) => x.ok);

  /* Second rating's own compliance, reported alongside the primary's for
     the nameplate and GTP -- a real dual-rated unit is guaranteed at both
     points, not just the one the active part happens to be sized to.
     limitNLL2/limitLL2 are put() the same overridable way as the primary's
     own limits (see deriveSpec). No-load loss is the same core, so it is
     checked against a different limit, not a different value. */
  let dualCompliance = null, dualCompliant = null;
  if (p.dualRating && p.kva2 > 0) {
    dualCompliance = {
      nll: { val: noLoad, lim: p.limitNLL2, ok: noLoad <= p.limitNLL2 },
      ll: { val: dualLoadLoss, lim: p.limitLL2, ok: dualLoadLoss <= p.limitLL2 },
      total: { val: dualTotalLoss, lim: p.limitNLL2 + p.limitLL2, ok: dualTotalLoss <= p.limitNLL2 + p.limitLL2 },
      rise: { val: dualOilRise, lim: riseLimit, ok: dualOilRise <= riseLimit + 0.5 },
      wRise: { val: dualWindRise, lim: wRiseLimit, ok: dualWindRise <= wRiseLimit + 0.5 },
    };
    dualCompliant = Object.values(dualCompliance).every((x) => x.ok);
  }

  return {
    p, grade, ct, std, fluid, dryT, cls, dry, B, cLV, cHV, dLV, dHV, clr, refT, shape, solvedZ,
    hvConn, lvConn, hvPh, lvPh, hvDesign, lvDesign, iLineHV, iLineLV, iHV, iLV,
    et, nLV, nHV, nHVmax, ratioErr, tapSteps, turnsPerStep,
    aNet: aNet * 1e4, aGross: aGross * 1e4, dCore, coreW, coreD, Hw, Ww: g.Ww, cc: g.cc,
    aLVreq, aHVreq, tLV: g.tLV, foilW: g.foilW, lvRadial: g.lvRadial, hvRadial: g.hvRadial,
    layers: g.layers, turnsPerLayer: g.turnsPerLayer, axHV: g.axHV, rdHV: g.rdHV, voltsPerLayer: g.voltsPerLayer,
    numGroups: g.numGroups, groupGap: g.groupGap, hvConstruction: p.hvConstruction,
    lvID: g.lvID, lvOD: g.lvOD, hvID: g.hvID, hvOD: g.hvOD, lmtLV: g.lmtLV, lmtHV: g.lmtHV, hLV: g.hLV, hHV: g.hHV,
    wLV, wHV, wLVCovered, wHVCovered, wCore, wLimb, wYoke, wIns, wFrame, wTank, wFin, wEnclosure, fluidLitres, coilArea,
    coreHeight, coreWidth, yokeDepth, tankL, tankW, tankH, tankArea, finAreaReq,
    wPerKg, noLoad, loadLoss, totalLoss, i0pct, i2rLV: g.i2rLV, i2rHV: g.i2rHV, rLV: g.rLV, rHV: g.rHV,
    pctX: g.pctX, pctR: g.pctR, pctZ: g.pctZ, regFull, oilRise, windRise, grad, hotspot, hotspotAvg, lifeFactor,
    riseLimit, wRiseLimit, eff100: effAt(1), eff75: effAt(0.75), eff50: effAt(0.5), maxEffLoad,
    iscLV: iLV * iscMult, iscHV: iHV * iscMult, iscMult, noise, sch, compliance, compliant,
    fanCount, pumpCount,
    dualForced, dualLoadLoss, dualTotalLoss, dualOilRise, dualWindRise, dualCompliance, dualCompliant,
    Kw, aWin, Hw0, util: shape === "circ" ? (STEP_UTIL[p.steps] || 0.94) : ct.aspect, sf: grade.sf,
    kTank, kFin, tankDissip, riseTarget, forcedMul, vaPerKg,
    rhoLV: rho(cLV), rhoHV: rho(cHV), dEff: g.dEff, hEff: g.hEff, X: g.X, lmtMean: g.lmtMean,
    lvTurnLayers: g.lvTurnLayers, hvDucts: g.hvDucts, i2r: g.i2rLV + g.i2rHV,
    tLVin: g.tLVin, tLVout: g.tLVout, tHVin: g.tHVin, tHVout: g.tHVout,
    lvAxCount: g.lvAxCount, lvRadCount: g.lvRadCount,
    hvAxCount: g.hvAxCount, hvRdCount: g.hvRdCount,
    lvConstruction: p.kva < p.lvFoilMaxKva ? "foil" : "strip",
  };
}

/* ============================================================
   COSTING
   ============================================================ */

function rkCond(k) { return k === "copper" ? "condCu" : k === "aluminium" ? "condAl" : "condCca"; }
function condRate(k, r) { return k === "copper" ? r.condCu : k === "aluminium" ? r.condAl : r.condCca; }

function buildBOM(d, r, extras = []) {
  const p = d.p;
  const bHV = r.bushHV * bushMul(p.umHV);
  const bLV = r.bushLV * bushMul(p.umLV);
  const vg = parseVectorGroup(p.vector);
  const coreRate = r.core * d.ct.costMul;

  const A = [
    { code: "CR-01", desc: `Core lamination \u2013 ${d.grade.name}, ${d.ct.name}`, qty: d.wCore, unit: "kg", rate: coreRate, rk: "core" },
    { code: "WD-01", desc: `LV winding \u2013 ${d.cLV.name}`, qty: d.wLV, unit: "kg", rate: condRate(p.condLV, r), rk: rkCond(p.condLV) },
    { code: "WD-02", desc: `HV winding \u2013 ${d.cHV.name}, ${d.hvConstruction === "layer" ? `${d.layers} layers` : d.hvConstruction === "crossover" ? `${d.numGroups} crossover coils, ${d.layers} layers each` : `${d.numGroups} discs, ${d.layers} turns each`}`, qty: d.wHV, unit: "kg", rate: condRate(p.condHV, r), rk: rkCond(p.condHV) },
    { code: "IN-01", desc: `Insulation for ${p.bilHV} kVp LI / ${p.acHV} kV AC, class ${p.insClass}`, qty: d.wIns, unit: "kg", rate: r.insulation, rk: "insulation" },
    { code: "FR-01", desc: "Core clamping frame, tie rods, MS fabricated", qty: d.wFrame, unit: "kg", rate: r.frameMS, rk: "frameMS" },
  ];
  if (d.dry) A.push({ code: "RS-01", desc: `${d.dryT.name} \u2013 resin, moulds, process`, qty: d.wLV + d.wHV, unit: "kg", rate: r.resin, rk: "resin" });

  const Bseg = d.dry
    ? [
      { code: "EN-01", desc: "Enclosure, IP-rated sheet metal with ventilation", qty: d.wEnclosure, unit: "kg", rate: r.enclosure, rk: "enclosure" },
      { code: "PT-01", desc: "Surface treatment and painting", qty: (2 * (d.tankL + d.tankW) * d.tankH) / 1e6, unit: "m\u00B2", rate: r.paint, rk: "paint" },
    ]
    : [
      { code: "TK-01", desc: "Tank body, cover, base channel \u2013 MS plate", qty: d.wTank, unit: "kg", rate: r.tankMS, rk: "tankMS" },
      { code: "TK-02", desc: `${p.tankType === "fin" ? "Corrugated fin wall" : "Pressed-steel radiators"} \u2013 ${f1(d.finAreaReq)} m\u00B2 surface`, qty: d.wFin, unit: "kg", rate: p.tankType === "fin" ? r.fin : r.radiator, rk: p.tankType === "fin" ? "fin" : "radiator" },
      { code: "OL-01", desc: d.fluid.name, qty: d.fluidLitres, unit: "L", rate: r.fluid, rk: "fluid" },
      { code: "PT-01", desc: "Surface treatment and painting", qty: d.tankArea + (2 * d.tankL * d.tankW) / 1e6 + d.finAreaReq * 0.35, unit: "m\u00B2", rate: r.paint, rk: "paint" },
      /* CALIBRATION.md section 20: fans on ONAF/OFAF/ODAF (all three are
         air-forced), an oil pump additionally on OFAF/ODAF (oil-forced), a
         control-gear-and-wiring lump whenever either is fitted. Rates
         default to 0 -- see DEFAULT_RATES's own comment -- so these rows
         price at zero, visibly, until a real rate is entered; they are not
         omitted, because a missing row is a missing row whether or not its
         rate has been filled in yet, and omitting it would hide that the
         quantity itself (d.fanCount) is real. */
      ...(d.fanCount > 0 ? [{ code: "CF-01", desc: `Cooling fans, ${p.cooling}${r.coolingFan ? "" : " \u2013 enter fan unit rate"}`, qty: d.fanCount, unit: "no", rate: r.coolingFan, rk: "coolingFan" }] : []),
      ...(d.pumpCount > 0 ? [{ code: "CP-01", desc: `Oil circulation pump, ${p.cooling}${r.oilPump ? "" : " \u2013 enter pump unit rate"}`, qty: d.pumpCount, unit: "no", rate: r.oilPump, rk: "oilPump" }] : []),
      ...(d.fanCount > 0 || d.pumpCount > 0 ? [{ code: "CG-01", desc: `Cooling control gear and wiring${r.coolingControlGear ? "" : " \u2013 enter control gear rate"}`, qty: 1, unit: "lot", rate: r.coolingControlGear, rk: "coolingControlGear" }] : []),
    ];

  const Cseg = [
    { code: "BS-01", desc: `HV bushings ${p.umHV} kV, ${p.bilHV} kVp LI, ${vg.hvLabels.join("/")}`, qty: vg.hvLabels.length, unit: "no", rate: bHV },
    { code: "BS-02", desc: `LV bushings ${p.umLV} kV, ${Math.ceil(d.iLineLV)} A, ${vg.lvLabels.join("/")}`, qty: vg.lvLabels.length, unit: "no", rate: bLV },
    {
      code: "TC-01",
      desc: p.tapType === "oltc" ? `OLTC, +${p.tapPlus}/-${p.tapMinus}% in ${f1(p.tapStep)}% steps, ${d.tapSteps} positions`
        : p.tapType === "octc" ? `Off-circuit tap switch, +${p.tapPlus}/-${p.tapMinus}%, ${d.tapSteps} positions` : "No tappings, links only",
      qty: 1, unit: "set", rate: p.tapType === "oltc" ? r.oltc : p.tapType === "octc" ? r.octc : 0,
      rk: p.tapType === "oltc" ? "oltc" : "octc",
    },
    { code: "AC-01", desc: d.dry ? "Fittings: temperature scanner, RTDs, terminal blocks" : "Fittings: valves, gauges, breather, explosion vent, thermometer pocket", qty: 1, unit: "set", rate: r.fittings, rk: "fittings" },
    { code: "AC-02", desc: "Cable box / marshalling box, earthing terminals", qty: 1, unit: "set", rate: r.cableBox, rk: "cableBox" },
    { code: "AC-03", desc: "Rating plate, terminal marking plate, diagram plate", qty: 1, unit: "set", rate: r.plateSet, rk: "plateSet" },
  ];
  if (p.dualHV || p.dualLV) Cseg.push({ code: "AC-04", desc: `Dual voltage link board ${p.dualHV ? (p.hv / 1000) + "/" + (p.hv2 / 1000) + " kV" : (p.lv) + "/" + (p.lv2) + " V"}`, qty: 1, unit: "set", rate: r.dualLink, rk: "dualLink" });

  const cost = (rows) => rows.reduce((s, x) => s + x.qty * x.rate, 0);
  const matA = cost(A), matB = cost(Bseg), matC = cost(Cseg);
  const extraCost = extras.reduce((s, x) => s + (+x.qty || 0) * (+x.rate || 0), 0);
  const material = matA + matB + matC + extraCost;

  const labour = [
    { code: "LB-01", desc: "Coil winding labour", qty: d.wLV + d.wHV, unit: "kg", rate: r.labWind, rk: "labWind" },
    { code: "LB-02", desc: "Core cutting, annealing and stacking", qty: d.wCore, unit: "kg", rate: r.labCore, rk: "labCore" },
    { code: "LB-03", desc: d.dry ? "Enclosure fabrication" : "Tank fabrication and welding", qty: d.dry ? d.wEnclosure : d.wTank + d.wFin, unit: "kg", rate: r.labTank, rk: "labTank" },
    { code: "LB-04", desc: d.dry ? "Assembly, curing and routine testing" : "Assembly, oil filtration, routine testing", qty: 1, unit: "lot", rate: r.assembly, rk: "assembly" },
  ];
  const labourCost = cost(labour);
  const scrap = (material * r.scrapPct) / 100;
  const factory = material + labourCost + scrap;
  const overhead = (factory * r.overheadPct) / 100;
  const works = factory + overhead + r.freight;
  const margin = (works * r.marginPct) / 100;
  const exFactory = works + margin;
  const gst = (exFactory * r.gstPct) / 100;
  const energy = ownershipCost(d, p);

  /* CALIBRATION.md section 20/22: coolingFan, oilPump and coolingControlGear
     have no basis to default to a nonzero rate, so a forced-cooled design
     can silently quote real fan/pump hardware at ₹0 if the rate card was
     never filled in -- exactly the "quoting one by accident" a zero-cost
     BOM row invites. Flagged explicitly here, once, rather than relying on
     a reader noticing a ₹0 rate column among dozens of rows. */
  const zeroCoolingRows = Bseg.filter((x) => ["coolingFan", "oilPump", "coolingControlGear"].includes(x.rk) && x.rate === 0);
  const warnings = zeroCoolingRows.length
    ? [{
      code: "cooling-cost-zero",
      message: `${p.cooling} is a forced-cooled design carrying ${zeroCoolingRows.map((x) => x.code).join(", ")} at ₹0 -- enter the fan/pump/control-gear rate before quoting, or this design is being priced without its own cooling equipment.`,
    }]
    : [];

  return {
    segments: [
      { title: "A: Core & coil assembly", rows: A, total: matA },
      { title: d.dry ? "B: Enclosure & finishing" : "B: Tank, cooling & fluid", rows: Bseg, total: matB },
      { title: "C: Accessories & terminations", rows: Cseg, total: matC },
      ...(extras.length ? [{ title: "D: Additional items", rows: extras, total: extraCost }] : []),
    ],
    labour, material, labourCost, scrap, overhead, freight: r.freight,
    factory, works, margin, exFactory, gst, withGst: exFactory + gst, energy,
    tco: exFactory + energy.total, warnings,
  };
}

function ownershipCost(d, p) {
  const hrs = 8760 * p.years;
  const kwhNoLoad = (d.noLoad * hrs) / 1000;
  const kwhLoad = (d.loadLoss * p.loadFactor * p.loadFactor * hrs) / 1000;
  return { kwhNoLoad, kwhLoad, noLoad: kwhNoLoad * p.tariff, load: kwhLoad * p.tariff, total: (kwhNoLoad + kwhLoad) * p.tariff };
}

/* Second costing model: a working designer's own per-kg card, reproduced
   line for line against a real one -- CALIBRATION.md section 9 ("630 KVA
   CU LEVEL 1 Costing & Data", verified to the rupee: 1127191.26). This is
   additive alongside buildBOM, not a replacement -- the two are on
   different bases and are not meant to reconcile:
     - Core, frame steel, tank steel and fluid share buildBOM's own rate
       keys (rates.core/frameMS/tankMS/fluid) so both models move together
       if a project's rate card changes them; nothing here duplicates or
       forks those figures.
     - LT/HT weight are priced on COVERED conductor mass (wLVCovered/
       wHVCovered), not the bare mass buildBOM's WD-01/WD-02 lines use --
       the sheet is pricing what is actually wound and goes in the tank,
       paper included. This is the one place the two models genuinely
       disagree on quantity, not just on markup structure, and that is
       deliberate: asked directly, this is the more physically honest
       basis for a coil that already has its covering on.
     - The panel row (PSR/radiator/fin, "No's" not kg) has no equivalent
       in buildBOM at all, which prices cooling surface by mass
       (TK-02, r.fin/r.radiator per kg). Panel count comes from finLayout,
       the same derivation the drawings already use -- not invented here.
     - Extra (the sheet's own rows 8 and 9, "Insulation & Fitting" and
       "Bushing & Metal Parts") is never computed. There is no single
       physical driver for that combination the way there is a mass for
       everything else -- it is the estimator's own figure, entered once
       per job, exactly as the sheet itself treats it as one number with
       no quantity or rate columns. Defaults to 0, never guessed.
     - No overhead, scrap, margin or GST layer. The sheet has none --
       labour and miscellaneous are folded into Extra, which is the whole
       point of a card this short. Do not add buildBOM's markup chain on
       top of this total; it would double-count what Extra already covers
       and this model would no longer be the card it was asked to match.
   Dry designs have no oil or fin/radiator rows (mirroring buildBOM's own
   dry/oil branch) -- not confirmed against any real dry cost card, since
   the one sheet this model was built against is oil-cooled. */
const DEFAULT_CARD_RATES = { finPanel: 600 };
function cardCostModel(d, rates, cardRates = DEFAULT_CARD_RATES, extra = 0) {
  // CALIBRATION.md section 25: finLayout is fin-tank-only (section 24) --
  // this was the one call site the "rewire every consumer" pass missed,
  // since it lives in the engine itself rather than a UI file the earlier
  // grep of src/ ever covered. A radiator design was getting finLayout's
  // fin-wall panel count under this model's own "PSR (pressed-steel
  // radiator)" row label -- the numbers were fin numbers regardless of
  // which label printed above them.
  const panels = d.dry ? 0 : (d.cardPanels ?? (d.p.tankType === "radiator" ? radiatorLayout(d).totalPanels : finLayout(d).n));
  const rows = [
    { no: 1, desc: "Core", qty: d.wCore, unit: "Kg", rate: rates.core },
    { no: 2, desc: "L.T Weight", qty: d.wLVCovered, unit: "Kg", rate: rates.condCu },
    { no: 3, desc: "H.T Weight", qty: d.wHVCovered, unit: "Kg", rate: rates.condCu },
    { no: 4, desc: "M.S Channel", qty: d.wFrame, unit: "Kg", rate: rates.frameMS },
    { no: 5, desc: "M.S Sheet", qty: d.dry ? d.wEnclosure : d.wTank, unit: "Kg", rate: rates.tankMS },
  ];
  if (!d.dry) {
    rows.push({ no: 6, desc: "Oil", qty: d.fluidLitres, unit: "Ltrs", rate: rates.fluid });
    rows.push({
      no: 7,
      desc: d.p.tankType === "fin" ? "Corrugated fin" : "PSR (pressed-steel radiator)",
      qty: panels, unit: "No's", rate: cardRates.finPanel,
    });
  }
  const withAmount = rows.map((r) => ({ ...r, amount: r.qty * r.rate }));
  const subtotal = withAmount.reduce((s, r) => s + r.amount, 0);
  const extraLabel = "Insulation & Fitting, Bushing & Metal Parts (Extra)";
  return { rows: withAmount, extra, extraLabel, subtotal, total: subtotal + extra };
}

/* ============================================================
   BUDGET SEARCH
   ============================================================ */

function fluxRange(gradeKey) {
  if (gradeKey === "amor") return [1.25, 1.30, 1.35, 1.40];
  return [1.50, 1.55, 1.60, 1.65, 1.70, 1.75, 1.80].filter((b) => b <= CORE_GRADES[gradeKey].bMax);
}

const DEFAULT_GAPSCALES = [0.9, 1.0, 1.12];

/* CALIBRATION.md section 36: CCA is excluded from the search permanently,
   not for its rate -- standard manufacturers do not buy copper-clad
   aluminium winding wire, for galvanic corrosion (a copper-aluminium
   junction under load-cycling thermal stress is a known failure point) and
   creep (aluminium's own long-term deformation under clamping pressure,
   which a copper cladding does not fix). No rate, however well sourced,
   re-enables it -- this is a manufacturability exclusion, the same class
   as the aspect-ratio and coil/tank-height limits, not a pricing one. */
const MATERIALS_EXCLUDED_FROM_SEARCH = new Set(["cca"]);

/* CALIBRATION.md section 33/36: condAl was unsourced (never confirmed
   against a real quote) when this mechanism was built -- section 36
   confirms it against the designer's own supplier range (Rs 380-420/kg,
   set at 400) and it is no longer gated here. Kept as a general mechanism,
   not retired, since a future rate could equally go unsourced again. */
const UNSOURCED_RATE_KEYS = new Set([]);
function unsourcedConductorRate(cond, rates) {
  const rk = rkCond(cond);
  return UNSOURCED_RATE_KEYS.has(rk) && rates[rk] === DEFAULT_RATES[rk];
}
function unsourcedConductorNote(conds, rates) {
  const excludedUnsourced = conds.filter((c) => unsourcedConductorRate(c, rates));
  const excludedMaterial = conds.filter((c) => MATERIALS_EXCLUDED_FROM_SEARCH.has(c));
  const parts = [];
  if (excludedUnsourced.length) {
    const names = excludedUnsourced.map((c) => `${CONDUCTORS[c].name} (${rkCond(c)})`).join(", ");
    parts.push(`${names} excluded: rate not sourced from a real quote. `
      + `Enter your own ${excludedUnsourced.map((c) => rkCond(c)).join("/")} rate in the rate card to include `
      + `${excludedUnsourced.length > 1 ? "them" : "it"}.`);
  }
  if (excludedMaterial.length) {
    const names = excludedMaterial.map((c) => CONDUCTORS[c].name).join(", ");
    parts.push(`${names} excluded: not offered as a winding material (galvanic corrosion, creep -- CALIBRATION.md section 36). Not a pricing question; no rate re-enables it.`);
  }
  return parts.length ? parts.join(" ") : null;
}

function searchDesigns(base, rates, band, opts) {
  const results = [];
  /* CALIBRATION.md section 42: a pin is the user saying they have a reason,
     often a tender requirement -- searchDesigns used to call fitToSchedule
     with an empty over on every candidate regardless of what the live
     design actually had pinned, so a search launched from a design with
     flux or density pinned would silently explore candidates that ignore
     the pin, then could recommend one of them. opts.over is the live
     design's own over (undefined/{} for callers that don't pass one,
     matching every existing call site's behaviour unchanged). Locked
     dimensions use the design's own pinned value as the candidate's
     starting point -- not the grade-clamped/conductor-anchored estimate
     below, which exists only to give an UNLOCKED bisection a sane start --
     and are then passed through to fitToSchedule so its own lock checks
     (identical to the main design path) hold them for real. */
  const over = opts.over || {};
  const lockFlux = over.flux !== undefined;
  const lockDensity = over.deltaLV !== undefined || over.deltaHV !== undefined;
  const grades = opts.grades.length ? opts.grades : [base.coreGrade];
  const condsRequested = opts.conds.length ? opts.conds : [base.condLV];
  const conds = condsRequested.filter((c) => !MATERIALS_EXCLUDED_FROM_SEARCH.has(c) && !unsourcedConductorRate(c, rates));
  const tanks = opts.tanks.length ? opts.tanks : [base.tankType];
  const cores = opts.cores.length ? opts.cores : [base.coreType];
  /* CALIBRATION.md section 2: K (etK) trades core steel for winding copper
     the same way material and core grade trade cost against loss, so it
     belongs in this same search -- a cheaper design can be one tank over
     with a different K, not only a different grade or metal. Defaults to
     the single value already in the design when the caller doesn't ask for
     a sweep, so an existing call site's candidate count and running time
     are unchanged unless it opts in.
     steps and tapType are wired the same way but are not defaulted on by
     BudgetTab: steps multiplies the grid by up to 7 and tapType by up to 3,
     and for most enquiries neither is a real cost lever -- the tap changer
     is a functional requirement of the duty, not a knob a cost search
     should be turning, unless the application itself already says none
     (isolation, UPS). Left here as genuine opt-in dimensions for whatever
     calls with a narrower grid, e.g. a single-material re-check. */
  const etKs = opts.etKs && opts.etKs.length ? opts.etKs : [base.etK];
  const stepsList = opts.stepsList && opts.stepsList.length ? opts.stepsList : [base.steps];
  const tapTypes = opts.tapTypes && opts.tapTypes.length ? opts.tapTypes : [base.tapType];
  /* Cooling and top-oil rise target are wired the same opt-in way as etK,
     steps and tapType above: absent, they collapse to the design's own
     current value, so an existing call site is unaffected. Rise target is
     the one worth sweeping by default when the caller wants a real budget
     search, because it is a genuine cost lever a designer can pull that the
     grid otherwise never reaches -- a hotter design needs less tank and fin
     steel for the same loss, trading tank cost against active-part cost, not
     just re-picking material or grade at a fixed rise. `allowHotter` is kept
     as a convenience for existing call sites: it only widens riseTargets when
     the caller hasn't supplied its own array, it is not a second lever. */
  const coolings = opts.coolings && opts.coolings.length ? opts.coolings : [base.cooling];
  const riseTargets = opts.riseTargets && opts.riseTargets.length
    ? opts.riseTargets
    : opts.allowHotter ? [45, 50] : [base.oilRiseTarget];
  /* CALIBRATION.md section 27: this grid used to enumerate flux (fluxRange)
     and density (the dScale multiplier ladder) as discrete points, the same
     way it enumerates grade or tank type. That is wrong for those two
     specifically, because they are not independent structural choices --
     they are the two levers fitToSchedule already bisects continuously to
     land just inside the loss schedule on the main design path. A discrete
     grid essentially never lands in that same narrow compliant window, so
     every candidate failed on load loss regardless of grade, tank or K:
     zero feasible results, always, on the default case. Each candidate here
     now calls fitToSchedule itself -- exactly what computeDesign does --
     so flux and density are fitted to the schedule per candidate rather
     than swept. gapScales stays a swept dimension: it moves lvHvClr, a
     structural clearance choice fitToSchedule has no opinion on. */
  const gapScales = opts.gapScales && opts.gapScales.length ? opts.gapScales : DEFAULT_GAPSCALES;

  for (const core of cores) {
    const ctd = CORE_TYPES[core];
    for (const g of grades) {
      if (ctd.grades === "amor" && g !== "amor") continue;
      if (ctd.grades === "crgo" && g === "amor") continue;
      // Same clamp fitToSchedule itself applies, used here only to give its
      // bisection a starting flux inside the grade actually being tried --
      // base.flux can easily sit outside a different grade's own bMax/bMin.
      const bMaxG = CORE_GRADES[g].bMax - 0.02;
      const bMinG = g === "amor" ? 1.20 : 1.42;
      // A pinned flux is the design's own current value, held exactly as
      // the main path holds it -- not reclamped into whatever grade is
      // being tried here, since a candidate the pin does not actually fit
      // is honestly infeasible, not something to quietly bend the pin for.
      const startFlux = lockFlux ? base.flux : Math.min(bMaxG, Math.max(bMinG, base.flux));
      for (const cond of conds) {
        // anchor the current-density ladder on the conductor being tried, not on the
        // one already in the design: aluminium needs a far lower density than copper --
        // unless density is pinned, in which case the pin is held regardless of conductor.
        const anchLV = lockDensity ? base.deltaLV : cond === base.condLV ? base.deltaLV : densitySuggest(base.kva, cond, base.medium === "dry", false);
        const anchHV = lockDensity ? base.deltaHV : cond === base.condHV ? base.deltaHV : densitySuggest(base.kva, cond, base.medium === "dry", true);
        for (const tk of tanks) {
          for (const gs of gapScales) {
            for (const cl of coolings) {
              for (const rt of riseTargets) {
                for (const ek of etKs) {
                  for (const st of stepsList) {
                    for (const tt of tapTypes) {
                      const candBase = {
                        ...base, coreType: core, buildFactor: ctd.bf, coreGrade: g,
                        condLV: cond, condHV: cond,
                        flux: startFlux, deltaLV: anchLV, deltaHV: anchHV,
                        autoClearance: false, tankType: tk, cooling: cl, oilRiseTarget: rt,
                        lvHvClr: Math.round(base.lvHvClr * gs),
                        etK: ek, steps: st, tapType: tt,
                        // Search candidates are always fitted to the loss
                        // schedule regardless of whether the live design
                        // itself has autoFit on -- a manually pinned flux on
                        // the design being priced is not a reason to skip
                        // fitting on a hypothetical candidate being explored.
                        autoFit: true,
                        // Not read by designTransformer -- lvHvClr above is
                        // the real input. Kept on the candidate purely so
                        // stagedSearchDesigns() can see which gapScale point
                        // a stage-1 winner actually used.
                        gapScale: gs,
                      };
                      // autoFitConverged (CALIBRATION.md section 38) is
                      // reporting, not a design parameter -- stripped
                      // before candBase merges into cand, same as
                      // computeDesign keeps it off designTransformer's own
                      // params. Carried on the result below instead.
                      const { autoFitConverged, ...fitted } = fitToSchedule(candBase, over);
                      const cand = { ...candBase, ...fitted };
                      const d = designTransformer(cand);
                      if (!isFinite(d.wCore) || d.wCore <= 0) continue;
                      const bom = buildBOM(d, rates);
                      const zOk = Math.abs(d.pctZ - base.targetZ) / base.targetZ <= opts.zTol / 100;
                      const thermalOk = d.compliance.rise.ok && d.compliance.wRise.ok;
                      const lossOk = !opts.enforceLimits || (d.compliance.nll.ok && d.compliance.ll.ok);
                      // CALIBRATION.md section 44 (was section 28's aspect
                      // ratio proxy): a candidate can be impedance-, thermal-
                      // and loss-compliant with a coil or tank the shop
                      // cannot actually build or move -- an ever taller,
                      // ever thinner coil is how this grid pays for lower
                      // load loss at a low K once flux and density are
                      // fitted rather than swept. Rejected here the same way
                      // zOk/thermalOk/lossOk already are, not left for a
                      // human to notice after the fact.
                      const shopLimitsOk = d.compliance.coilHeight.ok && d.compliance.tankHeight.ok;
                      results.push({
                        inputs: cand, d, bom, price: bom.exFactory, tco: bom.tco,
                        zOk, thermalOk, shopLimitsOk, lossOk, feasible: zOk && thermalOk && shopLimitsOk && lossOk,
                        autoFitConverged: autoFitConverged !== false,
                        withinBudget: bom.exFactory >= (band.min || 0) && bom.exFactory <= (band.max ?? Infinity),
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  const best = new Map();
  for (const x of results) {
    const k = [x.inputs.coreType, x.inputs.coreGrade, x.inputs.condLV, x.inputs.tankType,
      x.inputs.cooling, x.inputs.oilRiseTarget,
      x.d.B.toFixed(2), x.d.dLV.toFixed(2), x.d.dHV.toFixed(2),
      x.inputs.etK.toFixed(2), x.inputs.steps, x.inputs.tapType].join("|");
    const prev = best.get(k);
    if (!prev || x.tco < prev.tco) best.set(k, x);
  }
  const out = [...best.values()];
  const note = unsourcedConductorNote(condsRequested, rates);
  if (note) out.excludedNote = note;
  if (lockFlux || lockDensity) {
    const pinned = [];
    if (lockFlux) pinned.push(`flux density (${base.flux.toFixed(2)} T)`);
    if (lockDensity) pinned.push(`current density (LV ${base.deltaLV.toFixed(2)}, HV ${base.deltaHV.toFixed(2)} A/mm²)`);
    out.pinnedNote = `Every candidate holds the design's own pinned ${pinned.join(" and ")} -- `
      + `candidates where that pin does not fit the grade or conductor being tried are reported infeasible, not silently refitted around it.`;
  }
  return out;
}

const structKey = (x) => [x.inputs.coreType, x.inputs.coreGrade, x.inputs.condLV, x.inputs.tankType, x.inputs.cooling].join("|");

/* Picks up to `n` points around `value` in `all` (sorted ascending) --
   value's own nearest point plus its immediate neighbours, so a stage-2
   refinement gets full resolution in the region a stage-1 coarse point
   already looked good in, without re-scanning the whole range. Falls back
   to the full array if it is already <= n long -- windowing a 3-point
   gapScales array, for instance, would not save anything and would risk
   missing the actual best point over a rounding accident in "nearest". */
function windowAround(all, value, n) {
  if (all.length <= n) return all;
  let idx = 0, best = Infinity;
  all.forEach((v, i) => { const d = Math.abs(v - value); if (d < best) { best = d; idx = i; } });
  const half = Math.floor(n / 2);
  let lo = Math.max(0, idx - half);
  let hi = Math.min(all.length - 1, lo + n - 1);
  lo = Math.max(0, hi - n + 1);
  return all.slice(lo, hi + 1);
}

/* CALIBRATION.md section 27: searchDesigns' own grid now multiplies grade x
   conductor x tank x gapScale x cooling x riseTarget x etK (flux and density
   are fitted per candidate, not swept -- see the comment above that loop).
   That is already far smaller than the old flux/dScale-enumerated grid, but
   a typical BudgetTab call is still several thousand candidates, and each
   one now costs roughly eleven designTransformer calls instead of one (ten
   fitToSchedule iterations plus the final confirming call), so staging is,
   if anything, more valuable than it was before this fix, not less.

   Two-stage funnel instead of a smaller fixed grid, because a smaller fixed
   grid just moves the same problem (which candidates does it quietly never
   look at) rather than solving it:

   Stage 1 -- coarse screen, every structural combination (core type, core
   grade, conductor, tank type, cooling), at reduced resolution on the
   remaining continuous lever (~4 etK points instead of 16 or the full
   ETK_RANGE), a single gapScale and a single rise target. This is cheap
   precisely because it is not trying to find the true minimum yet, only to
   rank structural choices against each other well enough to discard the
   ones that are not competitive.

   Stage 2 -- for only the best few structural combinations from stage 1
   (opts.stagedTopN, default 5), re-run searchDesigns restricted to that one
   exact combination, at full gapScale/riseTarget resolution and an etK
   window centred on wherever stage 1's own winner for that combination
   landed (windowAround) -- full resolution, but only in the region already
   known to be competitive, not the whole range blindly.

   This is a heuristic, not an exhaustive search: a structural combination
   that stage 1's coarse point sampling made look uncompetitive is never
   revisited in stage 2, even if the true optimum for that combination (at
   some etK point stage 1 never happened to sample) would have beaten the
   winners that were kept. That is the actual, named trade, and it is the
   trade needed to keep this on a thread that can respond to a cancel button
   and paint a progress bar instead of freezing the tab. */
function stagedSearchDesigns(base, rates, band, opts, onProgress, shouldCancel) {
  const report = (info) => { if (onProgress) onProgress(info); };
  const cancelled = () => !!(shouldCancel && shouldCancel());
  const condsRequested = opts.conds && opts.conds.length ? opts.conds : [base.condLV];
  const conductorNote = unsourcedConductorNote(condsRequested, rates);

  const topN = opts.stagedTopN || 5;
  const etKsFull = opts.etKs && opts.etKs.length ? opts.etKs : ETK_RANGE;
  const gapScalesFull = opts.gapScales && opts.gapScales.length ? opts.gapScales : DEFAULT_GAPSCALES;
  const riseTargetsFull = opts.riseTargets && opts.riseTargets.length ? opts.riseTargets : [base.oilRiseTarget];

  // Coarse etK: evenly spaced subset of whatever range the caller gave.
  const ETK_COARSE_N = 4;
  const etKsCoarse = etKsFull.length <= ETK_COARSE_N ? etKsFull
    : Array.from({ length: ETK_COARSE_N }, (_, i) => etKsFull[Math.round((i * (etKsFull.length - 1)) / (ETK_COARSE_N - 1))]);

  if (cancelled()) return [];
  report({ stage: 1, phase: "start" });
  const stage1 = searchDesigns(base, rates, band, {
    ...opts,
    etKs: etKsCoarse,
    gapScales: [gapScalesFull[Math.floor(gapScalesFull.length / 2)]],
    riseTargets: [riseTargetsFull[0]],
  });
  report({ stage: 1, phase: "done", count: stage1.length });
  if (cancelled() || !stage1.length) { if (conductorNote) stage1.excludedNote = conductorNote; return stage1; }

  /* CALIBRATION.md section 31: the multi-basin failure this function's own
     header always named as possible, actually observed -- 630 and 2500 kVA
     both found feasible candidates on the full grid that stage 1 here
     never carried into stage 2. Cause: a structural combination's
     representative was picked by raw cheapest tco regardless of
     feasibility, so a combination whose only competitive coarse-etK point
     happened to be aspect-infeasible could still out-rank, and crowd out
     of the top-N cut, a combination whose feasible region was narrower but
     genuinely buildable. An infeasible candidate is not a cheaper version
     of a feasible one for this purpose -- it is not a real option at all,
     and must never win a structural combination's own representative slot,
     or the ranking between combinations, over one that is real. */
  const byStruct = new Map();
  for (const x of stage1) {
    const k = structKey(x);
    const prev = byStruct.get(k);
    if (!prev) { byStruct.set(k, x); continue; }
    const better = x.feasible === prev.feasible ? x.tco < prev.tco : x.feasible && !prev.feasible;
    if (better) byStruct.set(k, x);
  }
  const winners = [...byStruct.values()]
    .sort((a, b) => (a.feasible === b.feasible ? a.tco - b.tco : (a.feasible ? -1 : 1)))
    .slice(0, topN);

  const stage2 = [];
  for (let i = 0; i < winners.length; i++) {
    if (cancelled()) break;
    const w = winners[i];
    report({ stage: 2, phase: "tuple", tuple: i + 1, of: winners.length });
    const etKsWindow = windowAround(etKsFull, w.inputs.etK, ETK_COARSE_N + 1);
    const refined = searchDesigns(base, rates, band, {
      ...opts,
      grades: [w.inputs.coreGrade],
      conds: [w.inputs.condLV],
      tanks: [w.inputs.tankType],
      cores: [w.inputs.coreType],
      coolings: [w.inputs.cooling],
      etKs: etKsWindow,
      gapScales: gapScalesFull,
      riseTargets: riseTargetsFull,
    });
    stage2.push(...refined);
  }
  report({ stage: 2, phase: "done", count: stage2.length });

  // Same dedup searchDesigns() itself uses, applied once more across the
  // merged stage-2 results -- two winning structural combinations refined
  // separately can still land on near-identical final designs.
  const best = new Map();
  for (const x of stage2.length ? stage2 : stage1) {
    const k = [x.inputs.coreType, x.inputs.coreGrade, x.inputs.condLV, x.inputs.tankType,
      x.inputs.cooling, x.inputs.oilRiseTarget,
      x.d.B.toFixed(2), x.d.dLV.toFixed(2), x.d.dHV.toFixed(2),
      x.inputs.etK.toFixed(2), x.inputs.steps, x.inputs.tapType].join("|");
    const prev = best.get(k);
    if (!prev || x.tco < prev.tco) best.set(k, x);
  }
  const out = [...best.values()];
  if (conductorNote) out.excludedNote = conductorNote;
  if (stage1.pinnedNote) out.pinnedNote = stage1.pinnedNote;
  return out;
}

/* CALIBRATION.md section 2: K = Et/sqrt(kVA) trades core steel for winding
   copper (Et = K sqrt(kVA) = 4.44 f B Ai -- a higher K needs a bigger core
   for the same flux density, but fewer turns and so less copper for the
   same current). There is a real cost minimum, but its position depends on
   the copper to steel price ratio, not on the duty alone, which is why it
   is a search rather than a constant. This sweeps K alone, holding every
   other resolved parameter fixed (flux, current density, steps, tap type --
   whatever fitToSchedule and the rest of deriveSpec already settled for p),
   so the curve isolates K's own effect on ex-works price instead of
   confounding it with a simultaneous re-optimisation of flux or density at
   every point. That is also why it is a separate, small function rather
   than folded into searchDesigns' own etK dimension: this curve is read by
   fitEtkToCost on every computeDesign call and by the Fit to Budget K panel,
   both of which want one clean line, not one point out of the big grid's
   many thousands. */
const ETK_RANGE = Array.from({ length: 16 }, (_, i) => Math.round((0.40 + i * 0.02) * 100) / 100);

/* CALIBRATION.md section 39: one candidate's own worth at one K -- flux and
   density are re-fitted for THIS K (not held at whatever a different K's
   own fit left them at), so the point returned is self-consistent and, if
   selected, IS the design that gets built, not a preview of a cheaper K
   that a stale flux/density made look cheaper than it will actually be.
   Extracted so both the coarse and refine stages of etkCurve below call
   the exact same fit-then-build logic, never a stale shortcut for one
   stage and not the other. Returns the fitted flux/deltaLV/deltaHV
   alongside etK -- fitEtkToCost's own return must carry these too, or the
   winning K would be selected on a correct fit and then built with a
   different, stale one, the same bug one level further down. */
// CALIBRATION.md section 39: a loose, fast fit used purely to RANK K
// candidates against each other -- 15 iterations, 1% tolerance, against
// the real fit's 60 iterations and 0.2%. Never used for a number anyone
// sees: fitEtkToCost always re-fits the winning K at full precision
// before returning it (below), so this only ever affects which K wins,
// not what gets reported for it.
const ETK_SCAN_MAX_ITERS = 8, ETK_SCAN_TOL = 0.02;
function etkPoint(p, rates, k, over, fast = false) {
  // CALIBRATION.md section 39: start every K's own fit from the same,
  // K-independent point rather than wherever a DIFFERENT K's own fit left
  // flux/density -- fitToSchedule is a local iterative corrector, not a
  // global solve, so the same K can converge to a different fixed point
  // depending on where it started. A CLAMP of p's own carried-over value
  // is not a reset -- if that value already sits inside the grade's
  // bounds (the common case), the clamp is a no-op and the dependency on
  // whichever K happened to run first stays exactly as it was (found
  // directly: clamping alone left the default case's own K=0.46 point
  // unchanged, still non-converging). fluxSuggest/densitySuggest recompute
  // a genuinely fresh estimate, the same ones deriveSpec itself uses,
  // independent of any prior K's own fit. Locked dimensions keep the
  // caller's own explicit value, not reset.
  const lockF = over.flux !== undefined;
  const lockD = over.deltaLV !== undefined || over.deltaHV !== undefined;
  const dry = p.medium === "dry";
  const startFlux = lockF ? p.flux : fluxSuggest(p.coreGrade, p.effLevel, p.kva);
  const startDLV = lockD ? p.deltaLV : densitySuggest(p.kva, p.condLV, dry, false);
  const startDHV = lockD ? p.deltaHV : densitySuggest(p.kva, p.condHV, dry, true);
  const pk = { ...p, etK: k, flux: startFlux, deltaLV: startDLV, deltaHV: startDHV };
  const { autoFitConverged, ...fitted } = fast
    ? fitToSchedule(pk, over, ETK_SCAN_MAX_ITERS, ETK_SCAN_TOL)
    : fitToSchedule(pk, over);
  const d = designTransformer({ ...pk, ...fitted });
  if (!isFinite(d.wCore) || d.wCore <= 0) return null;
  const bom = buildBOM(d, rates);
  const zOk = Math.abs(d.pctZ - p.targetZ) / p.targetZ <= p.zTol / 100;
  const thermalOk = d.compliance.rise.ok && d.compliance.wRise.ok;
  const lossOk = d.compliance.nll.ok && d.compliance.ll.ok;
  // CALIBRATION.md section 44 (was section 28's aspect ratio proxy):
  // without this, a low K that trades an ever taller, ever thinner (and so
  // unbuildable) coil for lower load loss looks like a genuine saving to
  // this curve, and fitEtkToCost below would pick it for every AUTO-K
  // design at this rating, not only a search candidate.
  const shopLimitsOk = d.compliance.coilHeight.ok && d.compliance.tankHeight.ok;
  return {
    etK: k, exFactory: bom.exFactory, feasible: zOk && thermalOk && shopLimitsOk && lossOk,
    converged: autoFitConverged !== false, fitted,
  };
}

/* CALIBRATION.md section 39: this curve used to hold flux and current
   density fixed at whatever fitToSchedule had settled for the design's
   OWN starting K, then sweep etK across every point with that stale fit --
   comparing 16 candidates on 15 of them using a fit that was never actually
   theirs. A K that only looked cheap because the flux/density fitted for a
   different K happened to undersize its core could win, and the design
   built at that K afterward would not actually hold the declared margin
   (found directly: 630 kVA's own achieved load-loss margin collapsed from
   a correctly-fitted 7.11% to 0.59% once fitEtkToCost moved K away from
   what fitToSchedule had fitted). Re-fitting at every K point closes this,
   but costs roughly 10x more per point (fitToSchedule's own convergence
   loop, section 38, not one designTransformer call) -- too slow for every
   interactive computeDesign at the full 16-point range (measured: ~1.9s).
   Staged the same way stagedSearchDesigns is (CALIBRATION.md section 25):
   a coarse pass across the full range, refine with a full-resolution
   window around the coarse winner -- both stages call etkPoint() above,
   so every comparison this function ever makes is self-consistent, never
   the stale shortcut that caused the problem. Falls back to the full range
   only when the caller explicitly asks for a range shorter than the coarse
   count (search's own narrower K windows, already small). */
const ETK_CURVE_COARSE_N = 5;
function etkCurve(p, rates, over = {}, range = ETK_RANGE) {
  // CALIBRATION.md section 39: every point here is the fast scan (this
  // curve is for ranking and for the K Sweep chart's own shape, not a
  // number anyone adopts directly) -- fitEtkToCost re-fits its own winner
  // at full precision separately, below.
  if (range.length <= ETK_CURVE_COARSE_N) {
    return range.map((k) => etkPoint(p, rates, k, over, true)).filter(Boolean);
  }
  const coarseK = Array.from({ length: ETK_CURVE_COARSE_N }, (_, i) =>
    range[Math.round((i * (range.length - 1)) / (ETK_CURVE_COARSE_N - 1))]);
  const coarse = coarseK.map((k) => etkPoint(p, rates, k, over, true)).filter(Boolean);
  if (!coarse.length) return [];
  const coarsePool = coarse.filter((pt) => pt.feasible);
  const coarseBest = (coarsePool.length ? coarsePool : coarse).reduce((a, b) => (b.exFactory < a.exFactory ? b : a));
  const fineWindow = windowAround(range, coarseBest.etK, ETK_CURVE_COARSE_N + 2);
  const seen = new Set(coarseK);
  const refined = fineWindow.filter((k) => !seen.has(k)).map((k) => etkPoint(p, rates, k, over, true)).filter(Boolean);
  return [...coarse, ...refined];
}

/* Raises the AUTO etK from deriveSpec's fixed per-application multiplier
   (CALIBRATION.md section 2's "not adopted as a constant") to whatever this
   project's own rates put at the bottom of etkCurve. Mirrors fitToSchedule's
   own lockF/lockD gate: an explicit over.etK is the designer's own figure --
   from a customer's tender, a past design, a value entered by hand -- and is
   never second-guessed by a cost search, same as an explicit flux or density
   is never re-fit to the loss schedule.

   When some point on the swept range is fully compliant (impedance, thermal,
   window aspect and loss limits, the same four checks searchDesigns itself
   gates on), the cheapest of those is used, same as always.

   When none is: an earlier version of this function fell back to
   deriveSpec's own fixed AUTO suggestion, reasoning that picking a
   non-compliant point at all was worse than admitting the search found
   nothing. That reasoning traded a real, quantifiable saving (at 630 kVA,
   the fixed suggestion builds a core roughly 230 kg heavier than the
   cheapest point on the very same curve) for silence about a limitation
   that was going to be true regardless of which K got built -- the fixed
   suggestion is not compliant either at ratings where nothing on the curve
   is. Discarding the saving did not make the design any more compliant; it
   only hid the cost of not being. Now the cheapest point on the whole
   curve is used regardless, exactly as it would be if it had passed, but
   flagged explicitly (etkNonCompliant: true) with which limit the chosen
   point actually misses and by how much -- an engineer building to a K
   that cannot meet its own declared no-load loss needs to be told that
   plainly, not have it quietly averted by building something heavier and
   still non-compliant instead. */
function fitEtkToCost(p, over = {}, rates = DEFAULT_RATES) {
  if (over.etK !== undefined) return {};
  const curve = etkCurve(p, rates, over);
  if (!curve.length) return {};
  const pool = curve.filter((pt) => pt.feasible);
  if (pool.length) {
    const fastBest = pool.reduce((a, b) => (b.exFactory < a.exFactory ? b : a));
    // CALIBRATION.md section 39: the curve's own points are all fast scans
    // (ranking only) -- re-fit the actual winner at full precision before
    // returning anything, so what gets reported and built is never the
    // loose-tolerance number that merely won the ranking pass.
    const best = etkPoint(p, rates, fastBest.etK, over, false) || fastBest;
    return { etK: best.etK, ...best.fitted, etkFitConverged: best.converged };
  }

  const fastBest = curve.reduce((a, b) => (b.exFactory < a.exFactory ? b : a));
  const best = etkPoint(p, rates, fastBest.etK, over, false) || fastBest;
  const d = designTransformer({ ...p, etK: best.etK, ...best.fitted });
  const zOk = Math.abs(d.pctZ - p.targetZ) / p.targetZ <= p.zTol / 100;
  const missed = [];
  if (!d.compliance.nll.ok) missed.push(`no-load loss ${Math.round(d.compliance.nll.val)} W against ${Math.round(d.compliance.nll.lim)} W declared`);
  if (!d.compliance.ll.ok) missed.push(`load loss ${Math.round(d.compliance.ll.val)} W against ${Math.round(d.compliance.ll.lim)} W declared`);
  if (!zOk) missed.push(`impedance ${d.pctZ.toFixed(2)}% against ${p.targetZ}% declared`);
  if (!d.compliance.rise.ok) missed.push(`top-oil/enclosure rise ${d.compliance.rise.val.toFixed(1)} against ${d.compliance.rise.lim} °C`);
  if (!d.compliance.wRise.ok) missed.push(`winding rise ${d.compliance.wRise.val.toFixed(1)} against ${d.compliance.wRise.lim} °C`);
  if (!d.compliance.coilHeight.ok) missed.push(`coil height ${Math.round(d.compliance.coilHeight.val)} mm against ${Math.round(d.compliance.coilHeight.lim)} mm shop limit`);
  if (!d.compliance.tankHeight.ok) missed.push(`tank height ${Math.round(d.compliance.tankHeight.val)} mm against ${Math.round(d.compliance.tankHeight.lim)} mm shop limit`);
  const bFloor = p.coreGrade === "amor" ? 1.20 : 1.42;
  const floorNote = d.B <= bFloor + 0.001
    ? ` Flux is already at the ${bFloor.toFixed(2)} T floor for this core grade -- no lower K closes this; it needs a different loss schedule or a different grade.`
    : "";
  return {
    etK: best.etK,
    ...best.fitted,
    etkFitConverged: best.converged,
    etkNonCompliant: true,
    etkSearchNote: `No K from ${ETK_RANGE[0]} to ${ETK_RANGE[ETK_RANGE.length - 1]} keeps this design within every declared limit at ${p.kva} kVA. `
      + `Built at the cheapest point on the curve, K = ${best.etK}, ${inr(best.exFactory)} ex-works, rather than the fixed AUTO suggestion -- `
      + `still misses ${missed.join("; ")}.${floorNote}`,
  };
}

/* ============================================================
   IMPACT NARRATIVE
   ============================================================ */

function impacts(a, ba, b, bb, p) {
  const out = [];
  const dCost = bb.exFactory - ba.exFactory;
  const dNLL = b.noLoad - a.noLoad, dLL = b.loadLoss - a.loadLoss;
  const dEnergy = bb.energy.total - ba.energy.total;

  if (Math.abs(b.B - a.B) > 0.005) {
    const up = b.B > a.B;
    out.push({
      k: "Flux density", from: f2(a.B) + " T", to: f2(b.B) + " T", good: !up,
      body: `Core weight ${up ? "falls" : "rises"} by ${Math.abs(b.wCore - a.wCore).toFixed(0)} kg. No-load loss ${up ? "rises" : "falls"} by ${Math.abs(dNLL).toFixed(0)} W and no-load current moves ${f2(a.i0pct)}% to ${f2(b.i0pct)}%. Noise ${up ? "up" : "down"} about ${Math.abs((b.B - a.B) * 28).toFixed(0)} dB. ${up ? "Over-excitation margin at +10% system voltage narrows and inrush rises. Flag the inrush restraint setting to the protection engineer." : "More margin against over-fluxing and softer inrush."}`,
    });
  }
  if (Math.abs(b.dLV - a.dLV) > 0.02) {
    const up = b.dLV > a.dLV;
    out.push({
      k: "Current density", from: `${f2(a.dLV)} / ${f2(a.dHV)} A/mm\u00B2`, to: `${f2(b.dLV)} / ${f2(b.dHV)} A/mm\u00B2`, good: !up,
      body: `Conductor weight ${up ? "down" : "up"} ${Math.abs(b.wLV + b.wHV - a.wLV - a.wHV).toFixed(0)} kg. Load loss ${up ? "rises" : "falls"} ${Math.abs(dLL).toFixed(0)} W at the ${b.refT} \u00B0C reference. Gradient ${f1(a.grad)} to ${f1(b.grad)} K, hot-spot ${f1(a.hotspot)} to ${f1(b.hotspot)} \u00B0C at ${p.ambient} \u00B0C ambient. Paper ageing rate changes ${(a.lifeFactor / b.lifeFactor).toFixed(2)} times. ${up ? "Permissible cyclic overload drops. State the derating in the offer." : "More headroom for cyclic overload."}`,
    });
  }
  if (b.cLV.short !== a.cLV.short) {
    const toAl = b.cLV.short === "Al";
    out.push({
      k: "Conductor material", from: a.cLV.name, to: b.cLV.name, good: !toAl,
      body: toAl
        ? `Aluminium needs about 1.6 times the section for the same loss, so coils grow radially and the tank and fluid grow with them; part of the metal saving comes back as steel and oil. Proof stress is roughly half that of copper, so with ${f2(b.pctZ)}% impedance and ${f1(b.iscMult)} times rated fault current the hoop and bending stress must be re-checked. On site: bimetallic lugs, Belleville washers, joints re-torqued at year one and year three.`
        : "Copper cuts the coil build, tank size and fluid volume, raises short-circuit strength and simplifies terminations. It is also the largest single line in the bill.",
    });
  }
  if (b.grade.name !== a.grade.name || b.ct.name !== a.ct.name) {
    out.push({
      k: "Core steel and joint", from: `${a.grade.name.split(",")[0]}, ${a.ct.name.split(",")[0]}`, to: `${b.grade.name.split(",")[0]}, ${b.ct.name.split(",")[0]}`, good: b.wPerKg < a.wPerKg,
      body: `Specific loss ${f2(a.wPerKg)} to ${f2(b.wPerKg)} W/kg including the building factor (${f2(a.p.buildFactor)} to ${f2(b.p.buildFactor)}), and exciting current ${f2(a.i0pct)}% to ${f2(b.i0pct)}%. No-load loss is paid for 8,760 hours a year regardless of load; over ${p.years} years this line alone is worth ${inr(Math.abs(dNLL) * 8760 * p.years * p.tariff / 1000)}.${b.ct.name.includes("Amorphous") ? " Amorphous ribbon is brittle, needs its own core-building line, and gives a larger and noisier core." : ""}${b.ct.name.includes("butt-lap") ? " A butt-lap joint is quicker to build but the joint region carries most of the exciting current penalty." : ""}`,
    });
  }
  if (b.p.tankType !== a.p.tankType && !b.dry && !a.dry) {
    const toFin = b.p.tankType === "fin";
    out.push({
      k: "Tank and cooling", from: a.p.tankType === "fin" ? "Corrugated fin, sealed" : "Radiator with conservator", to: toFin ? "Corrugated fin, sealed" : "Radiator with conservator", good: !toFin,
      body: toFin
        ? "A sealed fin tank is cheaper and drops the conservator and breather maintenance, but there is no easy route for fluid top-up or filtration in service, and a damaged fin usually means a tank change."
        : "Radiators with a conservator cost more and bring breather maintenance, but they allow filtration, sampling and top-up in service, and detachable radiators simplify transport and repair.",
    });
  }
  if (Math.abs(b.oilRise - a.oilRise) > 1.5) {
    out.push({
      k: "Cooling surface", from: f1(a.oilRise) + " K top-fluid rise", to: f1(b.oilRise) + " K top-fluid rise", good: b.oilRise < a.oilRise,
      body: `Cooling surface moves from ${f1(a.finAreaReq)} to ${f1(b.finAreaReq)} m\u00B2 against a ${f0(b.riseLimit)} K limit. Running hotter accelerates fluid oxidation and paper ageing: shorten the fluid tests (BDT, moisture, acidity) to yearly and add dissolved-gas analysis at commissioning and annually after.`,
    });
  }
  if (Math.abs(b.pctZ - a.pctZ) > 0.15) {
    out.push({
      k: "Impedance", from: f2(a.pctZ) + " %", to: f2(b.pctZ) + " %", good: Math.abs(b.pctZ - p.targetZ) < Math.abs(a.pctZ - p.targetZ),
      body: `Symmetrical fault current at the terminals moves to ${f1(b.iscMult)} times rated, and regulation at ${p.pf} power factor moves from ${f2(a.regFull)}% to ${f2(b.regFull)}%. ${b.pctZ < a.pctZ ? "Lower impedance means higher fault current and higher mechanical force in the coils, and it changes load sharing in parallel operation." : "Higher impedance limits fault current but worsens regulation."} Tolerance under ${b.std.name} is \u00B1${b.std.zTol}%.`,
    });
  }
  if (a.compliant !== b.compliant) {
    out.push({
      k: "Declared losses", from: a.compliant ? "Meets the schedule" : "Outside the schedule", to: b.compliant ? "Meets the schedule" : "Outside the schedule", good: b.compliant,
      body: b.compliant
        ? `The budget design still sits inside the ${EFF_LEVELS[p.effLevel].name} loss schedule with the ${b.std.name} tolerance applied.`
        : `The budget design breaches the ${EFF_LEVELS[p.effLevel].name} schedule: no-load ${f0(b.noLoad)} W against ${f0(b.sch.nll)} W and load loss ${f0(b.loadLoss)} W against ${f0(b.sch.ll)} W. For a distribution transformer sold in India this is a labelling and acceptance problem, not just a commercial one: either the customer raises the budget or the enquiry has to be re-tendered at a lower efficiency level.`,
    });
  }

  /* SOLVER.md section 4: compliance detail, every check that changed state --
     not just the aggregate `compliant` verdict above, which can stay the same
     while one check starts failing and another starts passing. */
  const complianceLabel = { nll: "No-load loss", ll: "Load loss", total: "Total loss", z: "Impedance", rise: "Top rise", wRise: "Winding rise", ratio: "Ratio error", volley: "Interlayer voltage" };
  const flippedChecks = Object.keys(complianceLabel).filter((k) => a.compliance[k].ok !== b.compliance[k].ok);
  if (flippedChecks.length) {
    out.push({
      k: "Compliance", good: b.compliant || (!a.compliant && flippedChecks.some((k) => !a.compliance[k].ok && b.compliance[k].ok)),
      from: flippedChecks.map((k) => `${complianceLabel[k]} ${a.compliance[k].ok ? "passed" : "failed"}`).join(", "),
      to: flippedChecks.map((k) => `${complianceLabel[k]} ${b.compliance[k].ok ? "passes" : "fails"}`).join(", "),
      body: `${flippedChecks.length} check${flippedChecks.length > 1 ? "s" : ""} changed state. Overall verdict: ${a.compliant ? "was compliant" : "was not compliant"}, now ${b.compliant ? "compliant" : "not compliant"}.`,
    });
  }

  /* Weight impact: core, conductor, total. */
  const totalMass = (d) => d.wCore + d.wLV + d.wHV + d.wIns + d.wFrame + d.wTank + d.wFin + d.wEnclosure + d.fluidLitres * d.fluid.dens;
  const aMass = totalMass(a), bMass = totalMass(b);
  const aCond = a.wLV + a.wHV, bCond = b.wLV + b.wHV;
  if (Math.abs(bMass - aMass) > 1) {
    out.push({
      k: "Weight", from: f0(aMass) + " kg total", to: f0(bMass) + " kg total", good: bMass < aMass,
      body: `Core ${f0(a.wCore)} to ${f0(b.wCore)} kg, conductor ${f0(aCond)} to ${f0(bCond)} kg, total ${f0(aMass)} to ${f0(bMass)} kg. ${bMass > aMass ? "Heavier active part: check crane, foundation loading and transport limits." : "Lighter active part eases handling and transport."}`,
    });
  }

  /* Loss impact: no-load, load, and the life-cycle energy cost of the difference. */
  if (Math.abs(dNLL) > 1 || Math.abs(dLL) > 1) {
    const dNllEnergyCost = (dNLL * 8760 * p.years * p.tariff) / 1000;
    const dLlEnergyCost = (dLL * p.loadFactor * p.loadFactor * 8760 * p.years * p.tariff) / 1000;
    const dLossEnergyCost = dNllEnergyCost + dLlEnergyCost;
    out.push({
      k: "Losses", from: `${f0(a.noLoad)} W no-load, ${f0(a.loadLoss)} W load`, to: `${f0(b.noLoad)} W no-load, ${f0(b.loadLoss)} W load`, good: dNLL + dLL <= 0,
      body: `No-load ${dNLL >= 0 ? "up" : "down"} ${f0(Math.abs(dNLL))} W, load ${dLL >= 0 ? "up" : "down"} ${f0(Math.abs(dLL))} W. Over ${p.years} years at \u20B9${p.tariff}/kWh this difference alone is worth ${inr(Math.abs(dLossEnergyCost))} ${dLossEnergyCost <= 0 ? "saved" : "spent"}.`,
    });
  }

  /* Efficiency impact at full and half load. */
  if (Math.abs(b.eff100 - a.eff100) > 0.005 || Math.abs(b.eff50 - a.eff50) > 0.005) {
    out.push({
      k: "Efficiency", from: `${f3(a.eff100)}% full, ${f3(a.eff50)}% half`, to: `${f3(b.eff100)}% full, ${f3(b.eff50)}% half`, good: b.eff100 >= a.eff100,
      body: `Full-load efficiency ${b.eff100 >= a.eff100 ? "improves" : "drops"} by ${f3(Math.abs(b.eff100 - a.eff100))} points, half-load by ${f3(Math.abs(b.eff50 - a.eff50))} points. ${b.eff100 >= a.eff100 ? "Better figures for the name plate and the tender score." : "Efficiency label and tender scoring both take a hit."}`,
    });
  }

  const pctChange = (d, base) => (base ? Math.abs((d / base) * 100).toFixed(1) : "0.0");
  out.push({
    k: "Money, all in", from: inr(ba.exFactory) + " ex-works", to: inr(bb.exFactory) + " ex-works", good: dCost + dEnergy <= 0, big: true,
    body: `${dCost <= 0 ? "Saves" : "Adds"} ${inr(Math.abs(dCost))} today, ${pctChange(dCost, ba.exFactory)}% on ex-works (delivered ${inr(ba.withGst)} to ${inr(bb.withGst)}). Over ${p.years} years at \u20B9${p.tariff}/kWh and ${(p.loadFactor * 100).toFixed(0)}% load factor, energy cost ${dEnergy >= 0 ? "rises" : "falls"} by ${inr(Math.abs(dEnergy))}. Net over the life: ${inr(Math.abs(dCost + dEnergy))} ${dCost + dEnergy <= 0 ? "in the buyer's favour" : "against the buyer"}.`,
  });
  return out;
}

/* ============================================================
   CALCULATION SHEET
   Every quantity with the formula it came from, the numbers
   substituted into it, and the reference it is taken from.
   ============================================================ */

const REFS = {
  S: "Sawhney: Principles / Course in Electrical Machine Design, transformer design chapter",
  K: "Kulkarni & Khaparde, Transformer Engineering: Design, Technology and Diagnostics",
  B: "BHEL: Transformers, design and manufacturing practice",
  IEC1: "IEC 60076-1: general, losses and tolerances",
  IEC2: "IEC 60076-2: temperature rise",
  IEC3: "IEC 60076-3: insulation levels and dielectric tests",
  IS2026: "IS 2026: power transformers",
  IS1180: "IS 1180: energy efficiency levels for distribution transformers",
  IEEE12: "IEEE C57.12.00: general requirements",
  IEEE91: "IEEE C57.91: loading guide and insulation ageing",
};

function calcSheet(d, bom) {
  const p = d.p;
  const n = (x, k = 2) => (typeof x === "number" ? x.toFixed(k) : String(x));
  const R3 = "\u221A3";
  const S = [];
  const sec = (title, ref, rows) => S.push({ title, ref, rows });
  const row = (q, sym, formula, sub, res, ref, from) => ({ q, sym, formula, sub, res, ref, from });

  const star = (c) => (c === "y" || c === "Y");

  sec("1. Ratings, connections and currents", REFS.S, [
    row("Rated power", "S", "given", "n/a", `${p.kva} kVA`, "Enquiry", "input"),
    row("HV phase voltage", "V\u2081\u209A\u2095", d.hvConn === "D" ? "V\u2081\u209A\u2095 = V\u2081\u2097" : `V\u2081\u209A\u2095 = V\u2081\u2097 / ${R3}`,
      d.hvConn === "D" ? `= ${n(d.hvDesign, 0)}` : `= ${n(d.hvDesign, 0)} / 1.732`, `${n(d.hvPh, 1)} V`, REFS.S, "HV voltage, vector group"),
    row("LV phase voltage", "V\u2082\u209A\u2095", star(d.lvConn) ? `V\u2082\u209A\u2095 = V\u2082\u2097 / ${R3}` : "V\u2082\u209A\u2095 = V\u2082\u2097",
      star(d.lvConn) ? `= ${n(d.lvDesign, 0)} / 1.732` : `= ${n(d.lvDesign, 0)}`, `${n(d.lvPh, 1)} V`, REFS.S, "LV voltage, vector group"),
    row("HV line current", "I\u2081\u2097", `I\u2081\u2097 = S\u00D710\u00B3 / (${R3} \u00D7 V\u2081\u2097)`, `= ${p.kva}\u00D710\u00B3 / (1.732 \u00D7 ${n(p.dualHV ? Math.min(p.hv, p.hv2) : p.hv, 0)})`, `${n(d.iLineHV, 2)} A`, REFS.S, "rating, HV voltage"),
    row("HV phase current", "I\u2081\u209A\u2095", d.hvConn === "D" ? `I\u2081\u209A\u2095 = I\u2081\u2097 / ${R3}` : "I\u2081\u209A\u2095 = I\u2081\u2097",
      d.hvConn === "D" ? `= ${n(d.iLineHV, 2)} / 1.732` : `= ${n(d.iLineHV, 2)}`, `${n(d.iHV, 2)} A`, REFS.S, "HV line current"),
    row("LV line current", "I\u2082\u2097", `I\u2082\u2097 = S\u00D710\u00B3 / (${R3} \u00D7 V\u2082\u2097)`, `= ${p.kva}\u00D710\u00B3 / (1.732 \u00D7 ${n(p.dualLV ? Math.min(p.lv, p.lv2) : p.lv, 0)})`, `${n(d.iLineLV, 1)} A`, REFS.S, "rating, LV voltage"),
    row("LV phase current", "I\u2082\u209A\u2095", star(d.lvConn) ? "I\u2082\u209A\u2095 = I\u2082\u2097" : `I\u2082\u209A\u2095 = I\u2082\u2097 / ${R3}`,
      star(d.lvConn) ? `= ${n(d.iLineLV, 1)}` : `= ${n(d.iLineLV, 1)} / 1.732`, `${n(d.iLV, 1)} A`, REFS.S, "LV line current"),
  ]);

  sec("2. Volts per turn, turns and core area", REFS.S + " \u00B7 emf equation", [
    row("Trial volts per turn", "E\u209C\u2032", "E\u209C = K\u221AS", `= ${n(p.etK)} \u00D7 \u221A${p.kva}`, `${n(p.etK * Math.sqrt(p.kva))} V`, REFS.S, "K constant, rating"),
    row("LV turns", "N\u2082", "N\u2082 = round(V\u2082\u209A\u2095 / E\u209C\u2032)", `= round(${n(d.lvPh, 1)} / ${n(p.etK * Math.sqrt(p.kva))})`, `${d.nLV}`, REFS.S, "LV phase voltage, E\u209C"),
    row("Actual volts per turn", "E\u209C", "E\u209C = V\u2082\u209A\u2095 / N\u2082", `= ${n(d.lvPh, 1)} / ${d.nLV}`, `${n(d.et, 3)} V`, REFS.S, "LV turns"),
    row("HV turns at normal tap", "N\u2081", "N\u2081 = round(N\u2082 \u00D7 V\u2081\u209A\u2095 / V\u2082\u209A\u2095)", `= round(${d.nLV} \u00D7 ${n(d.hvPh, 0)} / ${n(d.lvPh, 1)})`, `${d.nHV}`, REFS.S, "LV turns, voltage ratio"),
    row("HV turns at extreme tap", "N\u2081\u2098\u2090\u2093", "N\u2081\u2098\u2090\u2093 = N\u2081(1 + tap\u208A/100)", `= ${d.nHV} \u00D7 (1 + ${p.tapPlus}/100)`, `${d.nHVmax}`, REFS.IS2026, "tap range"),
    row("Turns per tap step", "\u0394N", "\u0394N = N\u2081 \u00D7 step/100", `= ${d.nHV} \u00D7 ${n(p.tapStep, 3)}/100`, `${n(d.turnsPerStep, 2)}`, REFS.IS2026, "tap step"),
    row("Ratio error", "\u03B5", "\u03B5 = [(N\u2081/N\u2082)(V\u2082\u209A\u2095/V\u2081\u209A\u2095) \u2212 1] \u00D7 100", `= [(${d.nHV}/${d.nLV})(${n(d.lvPh, 1)}/${n(d.hvPh, 0)}) \u2212 1]\u00D7100`, `${n(d.ratioErr, 4)} %`, REFS.IS2026 + " \u00B7 limit \u00B10.5%", "turns"),
    row("Net core area", "A\u1D62", "A\u1D62 = E\u209C / (4.44 f B\u2098)", `= ${n(d.et, 3)} / (4.44 \u00D7 ${p.freq} \u00D7 ${n(d.B)})`, `${n(d.aNet, 1)} cm\u00B2`, REFS.S + " \u00B7 emf equation", "E\u209C, frequency, flux density"),
    row("Gross core area", "A\u1D4D", "A\u1D4D = A\u1D62 / k\u209B (stacking factor)", `= ${n(d.aNet, 1)} / ${n(d.sf, 3)}`, `${n(d.aGross, 1)} cm\u00B2`, REFS.K, "net area, steel grade"),
    d.shape === "circ"
      ? row("Core circle diameter", "d", "A\u1D62 = u \u00B7 k\u209B \u00B7 \u03C0d\u00B2/4  \u2192  d = \u221A(4A\u1D62/(\u03C0 u k\u209B))", `u = ${n(d.util, 3)} for ${p.steps} steps; = \u221A(4\u00D7${n(d.aNet / 1e4, 5)}/(\u03C0\u00D7${n(d.util, 3)}\u00D7${n(d.sf, 3)}))`, `${n(d.dCore, 1)} mm`, REFS.S + " \u00B7 stepped core utilisation", "net area, number of steps") : null,
    d.shape !== "circ"
      ? row("Limb section", "W \u00D7 D", "A\u1D62 = W\u00B7D\u00B7k\u209B with W = asp\u00B7D", `asp = ${n(d.ct.aspect, 2)}`, `${n(d.coreW, 1)} \u00D7 ${n(d.coreD, 1)} mm`, REFS.K, "net area, core type") : null,
  ].filter(Boolean));

  sec("3. Window from the output equation, then solved for impedance", REFS.S + " \u00B7 output equation", [
    row("Window space factor", "K\u1D65\u1D65", "K\u1D65\u1D65 = c / (30 + kV)", `= ${n(p.windowSpace, 1)} / (30 + ${n(d.hvDesign / 1000, 1)})`, `${n(d.Kw, 4)}`, REFS.S, "HV voltage, window constant"),
    row("Window area", "A\u1D65\u1D65", "S = 3.33 f B\u2098 A\u1D62 \u03B4 K\u1D65\u1D65 A\u1D65\u1D65 \u00D710\u207B\u00B3  \u2192  A\u1D65\u1D65", `\u03B4avg = ${n((d.dLV + d.dHV) / 2)} A/mm\u00B2`, `${n(d.aWin * 1e4, 0)} cm\u00B2`, REFS.S, "rating, flux density, core area, current density"),
    row("Trial window height", "H\u1D65\u1D65\u2080", "H\u1D65\u1D65 = \u221A(A\u1D65\u1D65/asp) \u00D7 asp", `asp = ${n(p.aspect)}`, `${n(d.Hw0, 0)} mm`, REFS.S, "window area, aspect"),
    row("Final window height", "H\u1D65\u1D65", p.autoWindow !== false
      ? "bisection on H\u1D65\u1D65 until the calculated %Z equals the declared value"
      : "H\u1D65\u1D65 = H\u1D65\u1D65\u2080 (impedance not enforced)",
      p.autoWindow !== false ? `target %Z = ${n(p.targetZ)} \u2192 converged ${d.solvedZ ? "yes" : "hit a bound"}` : "n/a",
      `${n(d.Hw, 0)} mm`, REFS.K + " \u00B7 leakage reactance control", "declared impedance, coil builds"),
    row("Window width, built", "W\u1D65\u1D65", "W\u1D65\u1D65 = C \u2212 d", `= ${n(d.cc, 0)} \u2212 ${n(d.dCore, 0)}`, `${n(d.Ww, 0)} mm`, REFS.S, "coil radial builds, clearances"),
    row("Limb centre distance", "C", "C = D\u2081\u2092 + phase clearance", `= ${n(d.hvOD, 0)} + ${n(p.phaseClr, 0)}`, `${n(d.cc, 0)} mm`, REFS.IEC3, "HV outer diameter, clearance"),
  ]);

  sec("4. Winding dimensions", REFS.S + " \u00B7 " + REFS.B, [
    row("LV conductor area", "a\u2082", "a\u2082 = I\u2082\u209A\u2095 / \u03B4\u2082", `= ${n(d.iLV, 1)} / ${n(d.dLV)}`, `${n(d.aLVreq)} mm\u00B2`, REFS.S, "LV current, LV current density"),
    row("LV coil height", "h\u2082", "h\u2082 = H\u1D65\u1D65 \u2212 2 \u00D7 end clearance", `= ${n(d.Hw, 0)} \u2212 2\u00D7${n(p.endClrLV, 0)}`, `${n(d.hLV, 0)} mm`, REFS.IEC3, "window height, clearance"),
    row("LV foil / strip", "t\u2082 \u00D7 b\u2082", "t\u2082 = a\u2082 / b\u2082", `= ${n(d.aLVreq)} / ${n(d.foilW, 0)}`, `${n(d.tLV)} \u00D7 ${n(d.foilW, 0)} mm, ${d.lvTurnLayers} radial layers`, REFS.B, "conductor area, coil height"),
    row("LV radial build", "b\u2082", "b\u2082 = layers \u00D7 (t\u2082 + insulation) + ducts", `= ${d.lvTurnLayers} \u00D7 (${n(d.tLV)} + ${n(p.lvIns)}) + ducts`, `${n(d.lvRadial, 1)} mm`, REFS.B, "turns, foil thickness, insulation"),
    row("HV conductor area", "a\u2081", "a\u2081 = I\u2081\u209A\u2095 / \u03B4\u2081", `= ${n(d.iHV, 2)} / ${n(d.dHV)}`, `${n(d.aHVreq)} mm\u00B2`, REFS.S, "HV current, HV current density"),
    row("HV conductor section", "ax \u00D7 rd", "rectangular 2.1:1, or round of equal area", "n/a", `${n(d.axHV)} \u00D7 ${n(d.rdHV)} mm`, REFS.B, "HV conductor area"),
    row("HV construction", "\u2014", "layer below hvLayerMaxKva; disc if OLTC or above hvDiscMinKva; crossover between \u2014 MANUFACTURING.md section 5", "n/a",
      d.hvConstruction === "layer" ? "Single continuous layer"
        : d.hvConstruction === "crossover" ? `Crossover, ${d.numGroups} coils`
          : `Disc wound, ${d.numGroups} discs`,
      REFS.K + " \u00B7 practice, not a physical law", "rating, tap changer type"),
    d.hvConstruction === "layer"
      ? row("Turns per layer", "n\u2097", "n\u2097 = floor(h\u2081 / (ax + paper))", `= floor(${n(d.hHV, 0)} / (${n(d.axHV)} + ${n(p.hvPaper)}))`, `${d.turnsPerLayer}`, REFS.B, "coil height, conductor size")
      : row("Turns per axial layer", "n\u2097", d.hvConstruction === "crossover" ? "n\u2097 = hvCrossoverTurnsPerLayer (fixed)" : "n\u2097 = 1 (a disc's turns stack radially, not axially)", "n/a", `${d.turnsPerLayer}`, REFS.B, "practice"),
    d.hvConstruction === "layer"
      ? row("Number of layers", "L", "L = ceil(N\u2081\u2098\u2090\u2093 / n\u2097)", `= ceil(${d.nHVmax} / ${d.turnsPerLayer})`, `${d.layers}`, REFS.B, "HV turns, turns per layer")
      : row(d.hvConstruction === "crossover" ? "Layers per coil" : "Turns per disc", "L", "L = ceil(N\u2081\u2098\u2090\u2093 / (groups \u00D7 n\u2097))", `= ceil(${d.nHVmax} / (${d.numGroups} \u00D7 ${d.turnsPerLayer}))`, `${d.layers}`, REFS.B, "HV turns, group count, turns per layer"),
    row("Volts per layer", "V\u2097", "V\u2097 = E\u209C \u00D7 n\u2097", `= ${n(d.et, 3)} \u00D7 ${d.turnsPerLayer}`, `${n(d.voltsPerLayer, 0)} V`, REFS.IEC3 + " \u00B7 interlayer stress", "E\u209C, turns per layer"),
    row("HV radial build", "b\u2081", "b\u2081 = L(rd + paper) + (L\u22121)\u00B7interlayer + ducts", `= ${d.layers}(${n(d.rdHV)}+${n(p.hvPaper)}) + ${d.layers - 1}\u00D7${n(p.hvInterlayer)} + ${d.hvDucts}\u00D76`, `${n(d.hvRadial, 1)} mm`, REFS.B, "layers, conductor, insulation"),
    row("LV inner / outer diameter", "D\u2082\u1D62 / D\u2082\u2092", "D\u2082\u1D62 = d + 2\u00B7(core\u2013LV);  D\u2082\u2092 = D\u2082\u1D62 + 2b\u2082", `= ${n(d.dCore, 0)} + 2\u00D7${n(p.coreLvClr, 0)}`, `${n(d.lvID, 0)} / ${n(d.lvOD, 0)} mm`, REFS.IEC3, "core diameter, clearance, LV build"),
    row("HV inner / outer diameter", "D\u2081\u1D62 / D\u2081\u2092", "D\u2081\u1D62 = D\u2082\u2092 + 2\u00B7(LV\u2013HV);  D\u2081\u2092 = D\u2081\u1D62 + 2b\u2081", `= ${n(d.lvOD, 0)} + 2\u00D7${n(p.lvHvClr, 0)}`, `${n(d.hvID, 0)} / ${n(d.hvOD, 0)} mm`, REFS.IEC3, "LV outer, gap, HV build"),
    row("Mean length of turn", "L\u2098\u209C", "L\u2098\u209C = \u03C0(D\u1D62 + D\u2092)/2", `LV = \u03C0(${n(d.lvID, 0)}+${n(d.lvOD, 0)})/2`, `${n(d.lmtLV, 3)} / ${n(d.lmtHV, 3)} m`, REFS.S, "coil diameters"),
  ]);

  sec("5. Resistance and load loss", REFS.K + " \u00B7 " + REFS.IEC1, [
    row("Resistivity at reference temperature", "\u03C1\u03B8", "\u03C1\u03B8 = \u03C1\u2082\u2080[1 + \u03B1(\u03B8 \u2212 20)]", `Cu: = ${n(d.cLV.rho20, 6)}[1 + ${d.cLV.alpha}(${d.refT} \u2212 20)]`, `${n(d.rhoLV, 5)} \u03A9\u00B7mm\u00B2/m`, REFS.IEC1, "conductor material, reference temperature"),
    row("LV resistance per phase", "R\u2082", "R\u2082 = \u03C1\u03B8 N\u2082 L\u2098\u209C / a\u2082", `= ${n(d.rhoLV, 5)} \u00D7 ${d.nLV} \u00D7 ${n(d.lmtLV, 3)} / ${n(d.aLVreq)}`, `${d.rLV.toExponential(4)} \u03A9`, REFS.S, "resistivity, turns, mean turn, area"),
    row("HV resistance per phase", "R\u2081", "R\u2081 = \u03C1\u03B8 N\u2081 L\u2098\u209C / a\u2081", `= ${n(d.rhoHV, 5)} \u00D7 ${d.nHV} \u00D7 ${n(d.lmtHV, 3)} / ${n(d.aHVreq)}`, `${n(d.rHV, 4)} \u03A9`, REFS.S, "resistivity, turns, mean turn, area"),
    row("Copper loss", "\u03A3I\u00B2R", "3I\u2082\u00B2R\u2082 + 3I\u2081\u00B2R\u2081", `= 3\u00D7${n(d.iLV, 1)}\u00B2\u00D7${d.rLV.toExponential(3)} + 3\u00D7${n(d.iHV, 2)}\u00B2\u00D7${n(d.rHV, 4)}`, `${n(d.i2r, 0)} W`, REFS.S, "currents, resistances"),
    row("Load loss including stray", "P\u1D04", "P\u1D04 = \u03A3I\u00B2R (1 + stray/100)", `= ${n(d.i2r, 0)} \u00D7 (1 + ${n(p.stray, 0)}/100)`, `${n(d.loadLoss, 0)} W`, REFS.K + " \u00B7 eddy and stray loss", "copper loss, stray allowance"),
  ]);

  sec("6. Core weight, no-load loss and exciting current", REFS.K, [
    row("Specific core loss", "w", "w = w\u1D63\u2091\u1da0 (B/B\u1D63\u2091\u1da0)^1.9 \u00D7 building factor", `= ${n(d.grade.wRef)} \u00D7 (${n(d.B)}/${n(d.grade.bRef)})^1.9 \u00D7 ${n(p.buildFactor)}`, `${n(d.wPerKg, 3)} W/kg`, REFS.K + " \u00B7 " + REFS.B, "grade, flux density, joint type"),
    row("Core weight, limb", "W\u2097\u1D62\u2098\u1D47", "per step, mitred both ends: length = 2 \u00D7 width (drawing 22, Plate A)", "see drawing 22, core cutting chart", `${n(d.wLimb, 1)} kg`, REFS.B, "stepped widths, lamination thickness"),
    row("Core weight, yoke", "W\u1D67\u2092\u2096\u2091", "W = \u03C1\u1da0\u2091 A\u1D4D \u00D7 2(2C + d)", `= 7650 \u00D7 ${n(d.aGross / 1e4, 5)} \u00D7 2(2\u00D7${n(d.cc / 1000, 3)} + ${n(d.dCore / 1000, 3)})`, `${n(d.wYoke, 1)} kg`, REFS.S, "core area, limb spacing"),
    row("Core weight, total", "W\u1da0\u2091", "W = W\u2097\u1D62\u2098\u1D47 + W\u1D67\u2092\u2096\u2091", `= ${n(d.wLimb, 1)} + ${n(d.wYoke, 1)}`, `${n(d.wCore, 1)} kg`, REFS.S, "limb weight, yoke weight"),
    row("No-load loss", "P\u2080", "P\u2080 = w \u00D7 W\u1da0\u2091", `= ${n(d.wPerKg, 3)} \u00D7 ${n(d.wCore, 1)}`, `${n(d.noLoad, 0)} W`, REFS.IS1180, "specific loss, core weight"),
    row("Exciting volt-amperes", "VA/kg", "VA/kg = va\u1D63\u2091\u1da0 (B/B\u1D63\u2091\u1da0)\u2074 \u00D7 joint factor", `joint factor = ${n(d.ct.exc, 2)} for ${d.ct.name.split(",")[0]}`, `${n(d.vaPerKg, 2)} VA/kg`, REFS.K, "grade, flux density, joint type"),
    row("No-load current", "I\u2080", "I\u2080% = VA/kg \u00D7 W\u1da0\u2091 / (S\u00D710\u00B3) \u00D7 100", `= ${n(d.vaPerKg, 2)} \u00D7 ${n(d.wCore, 1)} / ${p.kva}000 \u00D7 100`, `${n(d.i0pct)} %`, REFS.K, "exciting VA, core weight"),
    row("Conductor weight, bare", "W\u1D04\u1d64", "W = 3 N L\u2098\u209C a \u03C1\u2098", `LV: 3\u00D7${d.nLV}\u00D7${n(d.lmtLV, 3)}\u00D7${n(d.aLVreq)}\u00D710\u207B\u2076\u00D7${d.cLV.dens}`, `${n(d.wLV, 1)} + ${n(d.wHV, 1)} kg`, REFS.S, "turns, mean turn, area, density"),
    row("Conductor weight, covered", "W\u1D04\u1d64\u1D9C", "as bare, plus the paper/insulation covering's own volume at 1150 kg/m\u00B3", `LV +${n(p.lvIns, 2)} mm radial, HV +${n(p.hvPaper, 2)} mm on diameter`, `${n(d.wLVCovered, 1)} + ${n(d.wHVCovered, 1)} kg`, REFS.B, "bare weight, covering thickness"),
  ]);

  sec("7. Impedance, regulation and short-circuit current", REFS.S + " \u00B7 " + REFS.K, [
    row("Resistance component", "%R", "%R = P\u1D04 / (S\u00D710\u00B3) \u00D7 100", `= ${n(d.loadLoss, 0)} / ${p.kva}000 \u00D7 100`, `${n(d.pctR)} %`, REFS.S, "load loss, rating"),
    row("Effective leakage width", "\u0394", "\u0394 = a\u1D4D + (b\u2081 + b\u2082)/3", `= ${n(p.lvHvClr, 0)} + (${n(d.hvRadial, 1)} + ${n(d.lvRadial, 1)})/3`, `${n(d.dEff * 1000, 1)} mm`, REFS.S + " \u00B7 leakage flux", "gap, radial builds"),
    row("Effective coil height", "H\u2091\u1da0\u1da0", "H\u2091\u1da0\u1da0 = h \u00D7 Rogowski factor", `= ${n(Math.min(d.hLV, d.hHV), 0)} \u00D7 0.95`, `${n(d.hEff * 1000, 0)} mm`, REFS.K, "coil height"),
    row("Leakage reactance", "X", "X = 2\u03C0f\u03BC\u2080 N\u2082\u00B2 L\u2098\u209C \u0394 / H\u2091\u1da0\u1da0", `= 2\u03C0\u00D7${p.freq}\u00D74\u03C0\u00D710\u207B\u2077\u00D7${d.nLV}\u00B2\u00D7${n(d.lmtMean, 3)}\u00D7${n(d.dEff, 4)}/${n(d.hEff, 3)}`, `${n(d.X, 5)} \u03A9`, REFS.S + " \u00B7 " + REFS.K, "turns, geometry"),
    row("Reactance component", "%X", "%X = X I\u2082\u209A\u2095 / V\u2082\u209A\u2095 \u00D7 100", `= ${n(d.X, 5)} \u00D7 ${n(d.iLV, 1)} / ${n(d.lvPh, 1)} \u00D7 100`, `${n(d.pctX)} %`, REFS.S, "reactance, current, voltage"),
    row("Impedance", "%Z", "%Z = \u221A(%R\u00B2 + %X\u00B2)", `= \u221A(${n(d.pctR)}\u00B2 + ${n(d.pctX)}\u00B2)`, `${n(d.pctZ)} %`, REFS.IS2026 + ` \u00B7 tolerance \u00B1${n(p.zTol, 1)}%`, "%R, %X"),
    row("Regulation", "\u03B5\u1D63", "\u03B5\u1D63 = %R cos\u03C6 + %X sin\u03C6", `= ${n(d.pctR)}\u00D7${n(p.pf)} + ${n(d.pctX)}\u00D7${n(Math.sqrt(Math.max(0, 1 - p.pf * p.pf)))}`, `${n(d.regFull)} %`, REFS.S, "%R, %X, power factor"),
    row("Symmetrical fault current", "I\u209B\u1D04", "I\u209B\u1D04 = I\u1D63\u2090\u209C\u2091\u1D48 \u00D7 100/%Z", `= ${n(d.iLV, 1)} \u00D7 100/${n(d.pctZ)}`, `${n(d.iscLV, 0)} A LV, ${n(d.iscHV, 0)} A HV`, REFS.IEC1 + " \u00B7 short-circuit withstand", "impedance, rated current"),
  ]);

  const thermal = d.dry
    ? [
      row("Coil cooling surface", "A\u1D04", "sum of inner and outer cylindrical surfaces of both windings", "n/a", `${n(d.coilArea)} m\u00B2`, REFS.K, "coil geometry"),
      row("Winding rise", "\u0394\u03B8\u1D65\u1D65", "\u0394\u03B8 = [P\u209C\u2092\u209C / (k A\u1D04 \u00D7 1.35)]^0.8", `= [${n(d.totalLoss, 0)} / (${n(p.airDiss, 1)}\u00D7${n(d.coilArea)}\u00D71.35)]^0.8`, `${n(d.windRise, 1)} K`, REFS.IEC2, "total loss, coil surface"),
    ]
    : [
      row("Total loss", "P\u209C\u2092\u209C", "P\u209C\u2092\u209C = P\u2080 + P\u1D04", `= ${n(d.noLoad, 0)} + ${n(d.loadLoss, 0)}`, `${n(d.totalLoss, 0)} W`, REFS.IEC1, "no-load loss, load loss"),
      row("Tank wall area", "A\u209C", "A\u209C = 2(L + W)H", `= 2(${n(d.tankL, 0)}+${n(d.tankW, 0)})\u00D7${n(d.tankH, 0)}`, `${n(d.tankArea)} m\u00B2`, REFS.B, "tank dimensions"),
      row("Design temperature rise", "\u03B8\u209C", "\u03B8\u209C = min(target, oil limit, (winding limit \u2212 gradient)/0.8)", `= min(${n(p.oilRiseTarget, 0)}, ${n(d.riseLimit, 0)}, (${n(d.wRiseLimit, 0)}\u2212${n(d.grad, 1)})/0.8)`, `${n(d.riseTarget, 1)} K`, REFS.IEC2 + " \u00B7 " + REFS.IS2026, "limits, gradient"),
      row("Dissipation law", "P", "P = k A \u03B8^1.25", `k\u209C\u2090\u2099\u2096 = ${n(d.kTank, 3)}, k\u1da0\u1D62\u2099 = ${n(d.kFin, 3)}${d.forcedMul > 1 ? `, forced \u00D7${n(d.forcedMul, 2)}` : ""}`, `tank dissipates ${n(d.tankDissip, 0)} W`, REFS.B + " \u00B7 " + REFS.IEC2, "surface, rise, fluid"),
      row("Cooling surface required", "A\u1da0\u1D62\u2099", "A = (P\u209C\u2092\u209C \u2212 P\u209C\u2090\u2099\u2096) / (k\u1da0\u1D62\u2099 \u00B7 \u03B8^1.25)", `= (${n(d.totalLoss, 0)} \u2212 ${n(d.tankDissip, 0)}) / (${n(d.kFin, 3)}\u00D7${n(d.riseTarget, 1)}^1.25)`, `${n(d.finAreaReq)} m\u00B2`, REFS.B, "losses, tank area, target rise"),
      row("Top-fluid rise achieved", "\u0394\u03B8\u2092", "\u0394\u03B8 = [P\u209C\u2092\u209C / (k\u209C A\u209C + k\u1da0 A\u1da0)]^(1/1.25)", "n/a", `${n(d.oilRise, 1)} K, limit ${n(d.riseLimit, 0)} K`, REFS.IEC2, "loss, total surface"),
      row("Winding gradient", "g", "g = 2.4 \u03B4\u00B2 (material factor)", `= 2.4 \u00D7 ${n((d.dLV + d.dHV) / 2)}\u00B2`, `${n(d.grad, 1)} K`, REFS.K, "current density, material"),
      row("Average winding rise", "\u0394\u03B8\u1D65\u1D65", "\u0394\u03B8\u1D65\u1D65 = 0.8\u0394\u03B8\u2092 + g", `= 0.8\u00D7${n(d.oilRise, 1)} + ${n(d.grad, 1)}`, `${n(d.windRise, 1)} K, limit ${n(d.wRiseLimit, 0)} K`, REFS.IEC2 + " \u00B7 " + REFS.IS2026, "oil rise, gradient"),
    ];
  thermal.push(
    row("Hot-spot temperature", "\u03B8\u2095", d.dry ? "\u03B8\u2095 = ambient + \u0394\u03B8\u1D65\u1D65 + 1.1g" : "\u03B8\u2095 = ambient + \u0394\u03B8\u2092 + 1.3g",
      `= ${n(p.ambient, 0)} + ${n(d.dry ? d.windRise : d.oilRise, 1)} + ${d.dry ? 1.1 : 1.3}\u00D7${n(d.grad, 1)}`, `${n(d.hotspot, 1)} \u00B0C`, REFS.IEEE91 + " \u00B7 " + REFS.IEC2, "rise, gradient, ambient"),
    row("Relative insulation life", "F", "F = 2^((98 \u2212 \u03B8\u2095)/6) at the weighted ambient", `= 2^((98 \u2212 ${n(d.hotspotAvg, 1)})/6)`, `${n(d.lifeFactor)} \u00D7`, REFS.IEEE91, "hot-spot at weighted ambient"),
  );
  sec("8. Cooling and temperature rise", REFS.IEC2 + " \u00B7 " + REFS.K, thermal);

  sec("9. Performance", REFS.IEC1, [
    row("Efficiency at load fraction k", "\u03B7", "\u03B7 = kS cos\u03C6 / (kS cos\u03C6 + P\u2080 + k\u00B2P\u1D04)", `at k=1: = ${p.kva}000\u00D7${n(p.pf)} / (\u2026 + ${n(d.noLoad, 0)} + ${n(d.loadLoss, 0)})`, `${n(d.eff100, 3)} % full, ${n(d.eff50, 3)} % half`, REFS.S, "losses, rating, power factor"),
    row("Load for maximum efficiency", "k\u2098", "k\u2098 = \u221A(P\u2080/P\u1D04)", `= \u221A(${n(d.noLoad, 0)}/${n(d.loadLoss, 0)})`, `${n(d.maxEffLoad * 100, 0)} % of rating`, REFS.S, "no-load and load loss"),
    row("Sound level estimate", "L\u1D65\u2090", "empirical from rating, flux density and grade", `39 + 12.5\u00B7log(${p.kva}/100) + (${n(d.B)}\u22121.6)\u00D728`, `${n(d.noise, 0)} dB(A)`, REFS.B, "rating, flux density"),
  ]);

  /* The small end of the range is dominated by tank and oil, not the active
     part -- these three ratios are where that shows up, and where a wrong
     tank/fin/oil formula would be hardest to notice from the absolute
     numbers alone (a 100 kVA tank looks "small" in kg either way). Reported
     per kVA or per kW of total loss rather than as absolute weights so a
     design at one rating can be sanity-checked against another without
     doing the division by hand every time. Not gated on bom: none of the
     three need a rate card, only the design's own geometry. */
  sec("10. Outer design proportions", REFS.B, [
    row("Fluid per rating", "V\u2092/S", d.dry ? "not applicable" : "V\u2092 / kVA", d.dry ? "n/a" : `= ${n(d.fluidLitres, 0)} / ${p.kva}`, d.dry ? "n/a" : `${n(d.fluidLitres / p.kva, 2)} L/kVA`, REFS.B, "fluid volume, rating"),
    row("Tank and cooling mass per rating", "(W\u209C\u2090\u2099\u2096+W\u1DA0\u1D62\u2099)/S", d.dry ? "W\u2091\u2099\u1D9C\u2097\u1D52\u02E2\u1D58\u02B3\u1D49 / kVA" : "(W\u209C\u2090\u2099\u2096 + W\u1DA0\u1D62\u2099) / kVA", d.dry ? `= ${n(d.wEnclosure, 0)} / ${p.kva}` : `= (${n(d.wTank, 0)} + ${n(d.wFin, 0)}) / ${p.kva}`, `${n((d.dry ? d.wEnclosure : d.wTank + d.wFin) / p.kva, 2)} kg/kVA`, REFS.B, "tank/enclosure mass, fin mass, rating"),
    row("Cooling surface per kW total loss", "A\u1D9C\u2092\u2092\u2097/P\u209C\u2092\u209C", d.dry ? "A\u1D04 / (P\u209C\u2092\u209C/1000)" : "(A\u209C + A\u1DA0\u1D62\u2099) / (P\u209C\u2092\u209C/1000)", d.dry ? `= ${n(d.coilArea)} / (${n(d.totalLoss, 0)}/1000)` : `= (${n(d.tankArea)} + ${n(d.finAreaReq)}) / (${n(d.totalLoss, 0)}/1000)`, `${n((d.dry ? d.coilArea : d.tankArea + d.finAreaReq) / (d.totalLoss / 1000), 2)} m\u00B2/kW`, REFS.B, "cooling surface, total loss"),
  ]);

  if (bom) {
    sec("11. Materials and cost build-up", "Works costing practice \u00B7 rates are yours to set", [
      row("Fluid volume", "V\u2092", d.dry ? "not applicable" : "V = tank volume \u2212 active part volume, \u00D7 fittings factor", d.dry ? "n/a" : `tank ${n((d.tankL * d.tankW * d.tankH) / 1e9, 3)} m\u00B3`, d.dry ? "n/a" : `${n(d.fluidLitres, 0)} L`, REFS.B, "tank size, active part"),
      row("Raw material", "n/a", "\u03A3 (quantity \u00D7 rate) over segments A, B, C", "see the costing tab", inr(bom.material), "Your rates", "weights, rates"),
      row("Factory cost", "n/a", "material + conversion + scrap", `= ${inr(bom.material)} + ${inr(bom.labourCost)} + ${inr(bom.scrap)}`, inr(bom.factory), "Your rates", "material, labour"),
      row("Ex-works price", "n/a", "factory + overhead + freight + margin", `= ${inr(bom.factory)} + ${inr(bom.overhead)} + ${inr(bom.freight)} + ${inr(bom.margin)}`, inr(bom.exFactory), "Your rates", "factory cost, percentages"),
      row("Cost of losses over life", "n/a", "(P\u2080 + k\u00B2P\u1D04) \u00D7 8760 \u00D7 years \u00D7 tariff / 1000", `= (${n(d.noLoad, 0)} + ${n(p.loadFactor)}\u00B2\u00D7${n(d.loadLoss, 0)}) \u00D7 8760 \u00D7 ${p.years} \u00D7 ${n(p.tariff)}/1000`, inr(bom.energy.total), "Evaluation practice", "losses, tariff, load factor"),
    ]);
  }
  return S;
}


/* DRAWINGS.md drawing 22, CALIBRATION.md: lamination is slit to standard
   widths, not cut to whatever a continuous circle-packing optimum happens
   to land on -- the 1250 kVA core cutting chart runs 270 down to 50 in
   10 mm steps where the unsnapped optimum for this diameter and step count
   ends at 42. `increment` (default 10, 0 disables snapping -- used by
   engine.test.mjs's own classical-utilisation check, which is deliberately
   testing the pure continuous packing formula against Sawhney's textbook
   table, a different question from what real slit stock gives) rounds
   every width UP to the next multiple, never down or to nearest: a step
   narrower than its standard width would leave the circle under-filled at
   that radius, which a real core never does -- it always slightly
   overfills each pocket's corner instead. Only width is snapped; the
   stack depth (t/halfH) stays exactly what the continuous optimisation
   found, since standardising width is a slitting-stock decision, not a
   lamination-count one, and the two are independent. Utilisation and area
   are recomputed from the snapped widths, per CALIBRATION.md, so they
   reflect real material use (always >= the continuous ideal, since every
   width only ever moves up) rather than the geometric target. */
function stepWidths(n, d, increment = 10) {
  const R = d / 2;
  let a = Array.from({ length: n }, (_, i) => (Math.PI / 2) * ((i + 1) / (n + 1)));
  const area = (al) => {
    let s = 0, prev = 0;
    for (let i = 0; i < al.length; i++) { const b = Math.sin(al[i]); s += Math.cos(al[i]) * (b - prev); prev = b; }
    return s;
  };
  let step = 0.25;
  for (let it = 0; it < 300; it++) {
    for (let i = 0; i < n; i++) {
      const base = area(a);
      for (const dlt of [step, -step]) {
        const t = [...a];
        t[i] = Math.min(Math.PI / 2 - 1e-4, Math.max(1e-4, t[i] + dlt));
        t.sort((x, y) => x - y);
        if (area(t) > base) { a = t; break; }
      }
    }
    step *= 0.982;
  }
  const rows = [];
  let prevH = 0, total = 0;
  for (let i = 0; i < n; i++) {
    const wIdeal = 2 * R * Math.cos(a[i]);
    /* CALIBRATION.md section 28: real core charts (Samruddhi Milk 800 kVA,
       widest pocket 230 mm on a 236 mm core; the 1250 kVA 750+500 furnace
       chart, 220 mm on 224 mm) put the widest step at 0.975-0.982 of the
       core diameter, never at or above it -- a lamination plate wider than
       the core it sits inside is not a thing that can be built. Rounding
       every step's wIdeal UP to the next stepIncrement can and did push the
       widest step past the diameter itself (233.15mm -> 240mm on a 236mm
       core, before this fix). But rounding every step DOWN instead moved
       the 1250 kVA distribution reference's own Plate A total (validated
       to -1.4% against a real cut chart, CALIBRATION.md section 16) to
       -9.7% -- rounding direction is not uniformly wrong, only the specific
       case where it produces a physically impossible width is. Clamped
       instead: round up as before, unless that would put the step at or
       past the core diameter, in which case round down. Reproduces both
       furnace charts' widest pocket exactly (233.15 -> 230, 221.29 -> 220,
       since both ceiled values exceed their own core diameter) while
       leaving every other step's rounding, and the 1250 kVA distribution
       reference's Plate A total, unchanged. */
    const wCeil = increment > 0 ? Math.ceil(wIdeal / increment) * increment : wIdeal;
    const w = wCeil < d ? wCeil : Math.floor(wIdeal / increment) * increment;
    const h = R * Math.sin(a[i]);
    const t = i === 0 ? 2 * h : h - prevH;      // centre pocket is full depth, others are per side
    rows.push({ w, wIdeal, t, halfH: h, perSide: i > 0 });
    total += w * (i === 0 ? 2 * h : 2 * (h - prevH));
    prevH = h;
  }
  return { rows, util: total / (Math.PI * R * R), area: total };
}

/* CALIBRATION.md section 16: two independent fixes, found together because
   fixing the first exposed the second -- they had been compensating for
   each other in the total, which is exactly why "the total looks close"
   was never proof either half was right.

   Limb: the edges used to be Hw + 2w (long) and Hw (short) -- window
   height as the short edge, the same Hw-based shortcut wCore's own limb
   term used and no longer does (section 15). Rebuilt on the one
   relationship wCore's fix and drawing 22's Plate A both already
   established: a mitred-both-ends limb lamination's average length is 2w
   (validated against a real cut plate to -1.4%), and a 45 degree mitre at
   each end changes the edge length by w per end, so long - short = 2w
   independent of what the average turns out to be. Solving both together
   gives short = w, long = 3w -- not a second fit, the one average
   combined with the mitre angle, which is geometry, not curve-fitting.

   Yoke: the edges were 2C + w (long) and 2C - w (short) -- averaging to
   2C exactly, missing the +dCore term wCore's own yoke span
   (2*cc + dCore) always carried, the same "outside-to-outside" allowance
   for the outer limbs' own width DRAWINGS.md's universal requirements
   assume everywhere else a yoke length is dimensioned. Checked, not
   assumed: with the old 2C-only average, this schedule's yoke total ran
   888.8 kg against wCore's own 1093.3 kg on the 1250 kVA reference --
   18.7% short, previously invisible because the old limb term's own
   overstatement (+18.5%) landed the COMBINED total close to wCore's old
   (also inflated) figure by coincidence, not because either half agreed
   with anything. Now 2C + dCore + w / 2C + dCore - w, average
   2C + dCore, matching wCore's own yoke term (and so drawing 22's
   Plate B + Plate C) to within rounding -- same 45 degree, both-ends
   mitre relationship (long - short = 2w) preserved, only the anchor
   corrected.

   The mass formula itself is untouched throughout (average edge x width x
   stack x density, the shape it always was) -- only what the two
   averages resolve to changed, so wCore, drawing 21 and drawing 22 now
   all derive limb and yoke from the same two figures instead of three
   sets of numbers that used to land close by coincidence of this
   reference's own proportions, not by agreement. */
function stampingSchedule(d, steps) {
  const thk = d.grade.thk || 0.27;
  const C = d.cc, dC = d.dCore;
  let wt = 0, sheets = 0;
  const rows = steps.rows.map((s, i) => {
    const stack = i === 0 ? s.t : 2 * s.t;
    const nSheets = Math.max(2, Math.round(stack / thk));
    const limbLong = 3 * s.w, limbShort = s.w;
    const yokeLong = 2 * C + dC + s.w, yokeShort = 2 * C + dC - s.w;
    const aLimb = (((limbLong + limbShort) / 2) * s.w) / 1e6;
    const aYoke = (((yokeLong + yokeShort) / 2) * s.w) / 1e6;
    const mass = (3 * aLimb + 2 * aYoke) * (stack / 1000) * 7650;
    wt += mass; sheets += nSheets * 5;
    return { i: i + 1, w: s.w, stack, nSheets, limbLong, limbShort, yokeLong, yokeShort, mass };
  });
  return { rows, totalMass: wt, totalSheets: sheets, thk };
}

/* DRAWINGS.md drawing 22, CALIBRATION.md section 12: the core CUTTING
   CHART, a different document from stampingSchedule's cutting SCHEDULE
   above -- that one models two plate types (limb, yoke) from the
   long/short mitred-edge average; this one models three (limb, half yoke,
   full yoke) because that is what the one real chart checked against
   actually shows, and the two are not meant to reconcile line for line.
   stampingSchedule is untouched.

   All three lengths are fitted to the one 1250 kVA chart available
   (CALIBRATION.md), each against the cleanest formula that reproduced its
   own plate total without a free intercept, not the closest arbitrary fit:

   - Plate A (limb, mitred both ends): length = 2 x width exactly, no
     offset -- a symmetric double 45 degree mitre with no straight run
     between the two cuts. Reproduces the chart's 621.09 kg to -1.4%.
   - Plate C (full yoke, mitred one end): length = 2*cc + width -- this
     engine's own existing yokeLong edge (stampingSchedule above), not a
     new formula, just applied with only the one mitre this plate actually
     has, not averaged against a short edge that does not exist here.
   - Plate B (half yoke, step-lap): the SAME steel as Plate C's formula
     would give for the same sheet count, cut as two half-length pieces
     per layer instead of one -- mass-conserving by construction, so its
     weight is computed directly from Plate C's own length x its own 25%
     share of the yoke sheet count, not a separate formula. Reported
     length is that half, for the drawing.
   - The 75/25 split between Plate C and Plate B reproduces the chart's own
     788.84/263.822 kg split almost exactly (263.822/(263.822+788.84) =
     0.2506). The 50/25/25 split of Plate B's own sheets across the 0, 10
     and 20 mm step-lap shifts is stated directly, not fitted.
   - Confirms C minus A grows across the steps, as stated: at this
     reference, C - A runs from 738.6 mm at step 1 to 958.6 mm at step 15,
     monotonically, because A shrinks (2w) while C barely moves (2cc + w
     against a cc roughly double any single step's width).

   Combined chart total against this one reference: 2% over 1672.8 kg --
   good agreement for a reconstruction from stated relationships and two
   aggregate totals, not the source chart's own per-step table, which this
   engine has never seen. Ask for a second real chart, at a different
   rating, before trusting any of these three formulas away from ratings
   near 1250 kVA -- exactly the caveat every other single-chart-fitted
   constant in this engine already carries. */

/* CALIBRATION.md section 35: Construction B, the V-notch/outer/centre
   pattern the 1250 kVA (750+500) OLTC furnace chart uses (sections 28, 34)
   -- a genuinely different lamination pattern from Construction A above,
   not a relabelling of it. Plate-count structure confirmed directly by the
   designer, not inferred: two V-notch plates per layer (the yoke, top and
   bottom), two outer plates per layer (the two outer limbs), one centre
   plate per layer (the one centre limb) -- centre's own total comes out
   near half the others because there is one centre limb against two of
   everything else, not because centre plates are physically thinner.

   The three stated lengths (2*cc+w for V-notch, Hw+2*w for outer, outer-52
   for centre) are OUTER edges, not the mean length the mass calculation
   needs -- reproducing them literally overstates every plate (checked
   directly: Construction A's own already-validated yoke formula, applied
   unchanged to this geometry, gives 562.77 kg against the real 397.69 kg,
   +41.5%). The gap scales linearly with each step's own width, consistent
   with a 45 degree mitre (section 15's own "long - short = 2w"), so each
   length is corrected by k*w before use.

   MITRE_K's three coefficients are solved exactly against the one chart
   available, once the plate-count structure above was pinned by the
   designer -- three equations (the three plate totals: V-notch 397.69 kg,
   outer 500.25 kg, centre 223.73 kg), three unknowns, solved to reproduce
   them exactly. This is NOT the same as an independently derived formula:
   with exactly as many free coefficients as target totals, an exact match
   is guaranteed by the algebra regardless of whether the underlying
   per-step model is fully correct away from this one geometry. Pure
   45-degree-mitre-only geometry (2 ends per plate, w/2 per end) predicts
   1.0 for V-notch and outer, 0.5 for centre -- the solved values (1.446,
   1.275, 1.465) are well above that, meaning there is a real additional
   deduction (the V-notch cutout itself, a limb-yoke joint allowance, or
   both) this engine cannot separate out from one chart's three aggregate
   totals alone. Unconfirmed at any rating besides this one -- a second
   real Construction B chart, at different proportions, would let these
   three numbers actually be checked rather than assumed to hold, the same
   caveat every other single-chart-fitted constant in this engine already
   carries. */
const MITRE_K = { vNotch: 1.44585, outer: 1.27514, centre: 1.46509 };
function coreConstructionB(dCore, cc, Hw, steps, thk, dens = 7650) {
  const rows = steps.rows.map((s, i) => {
    const stack = i === 0 ? s.t : 2 * s.t;
    const nSheets = Math.max(2, Math.round(stack / thk));

    const lenVNotch = (2 * cc + s.w) - MITRE_K.vNotch * s.w;
    const vSheets = nSheets * 2; // top + bottom yoke
    const massV = ((s.w * lenVNotch * thk) / 1e9) * dens * vSheets;

    const lenOuterStated = Hw + 2 * s.w;
    const lenOuter = lenOuterStated - MITRE_K.outer * s.w;
    const oSheets = nSheets * 2; // two outer limbs
    const massO = ((s.w * lenOuter * thk) / 1e9) * dens * oSheets;

    const lenCentre = (lenOuterStated - 52) - MITRE_K.centre * s.w;
    const cSheets = nSheets * 1; // one centre limb
    const massC = ((s.w * lenCentre * thk) / 1e9) * dens * cSheets;

    return {
      i: i + 1, w: s.w, stack, nSheets,
      V: { length: +lenVNotch.toFixed(1), weight: massV, sheets: vSheets },
      O: { length: +lenOuter.toFixed(1), weight: massO, sheets: oSheets },
      C: { length: +lenCentre.toFixed(1), weight: massC, sheets: cSheets },
    };
  });
  const totalV = rows.reduce((s, r) => s + r.V.weight, 0);
  const totalO = rows.reduce((s, r) => s + r.O.weight, 0);
  const totalC = rows.reduce((s, r) => s + r.C.weight, 0);
  return { construction: "B", rows, thk, totalV, totalO, totalC, chartTotal: totalV + totalO + totalC };
}

function coreCuttingChart(d, p) {
  const steps = stepWidths(p.steps, d.dCore, p.stepIncrement);
  const thk = d.grade.thk || 0.27;
  if (p.coreConstruction === "B") return coreConstructionB(d.dCore, d.cc, d.Hw, steps, thk);
  const dens = 7650;
  const cc = d.cc;
  const rows = steps.rows.map((s, i) => {
    const stack = i === 0 ? s.t : 2 * s.t;
    const nSheets = Math.max(2, Math.round(stack / thk));

    const lenA = 2 * s.w;
    const massA = ((s.w * lenA * thk) / 1e9) * dens * nSheets * 3; // 3 limbs

    const lenYoke = 2 * cc + s.w; // Plate C's own full length
    const yokeSheets = nSheets * 2; // top + bottom yoke positions
    const cSheets = Math.round(yokeSheets * 0.75);
    const bSheets = yokeSheets - cSheets; // sums exactly, never drifts
    const shift0 = Math.round(bSheets * 0.5);
    const shift10 = Math.round((bSheets - shift0) / 2);
    const shift20 = bSheets - shift0 - shift10;

    const massC = ((s.w * lenYoke * thk) / 1e9) * dens * cSheets;
    const massB = ((s.w * lenYoke * thk) / 1e9) * dens * bSheets; // full-length steel, cut in half

    return {
      i: i + 1, w: s.w, stack, nSheets,
      A: { length: +lenA.toFixed(1), weight: massA },
      B: { length: +(lenYoke / 2).toFixed(1), weight: massB, sheets: bSheets, shift0, shift10, shift20 },
      C: { length: +lenYoke.toFixed(1), weight: massC, sheets: cSheets },
    };
  });
  const totalA = rows.reduce((s, r) => s + r.A.weight, 0);
  const totalB = rows.reduce((s, r) => s + r.B.weight, 0);
  const totalC = rows.reduce((s, r) => s + r.C.weight, 0);
  return { construction: "A", rows, thk, totalA, totalB, totalC, chartTotal: totalA + totalB + totalC };
}

/* CALIBRATION.md section 24: finLayout is now the corrugated-fin-wall
   layout only -- it used to also stand in for radiator tanks (fed
   `finAreaReq` through the same "2 x height x depth" per-fin area at a
   flat 320 mm depth regardless of rating), which is a fin wall's own
   geometry, not a radiator's: at 2500 kVA with tankType radiator this
   returned 158 "fins" 320 mm deep, a corrugated fin wall wearing a
   radiator's name, not an actual bank-and-header radiator layout.
   Called only for p.tankType === "fin" designs now; radiatorLayout()
   below is the tankType === "radiator" equivalent, on its own real
   geometry (panels and banks, not fins). */
function finLayout(d) {
  if (d.dry || d.finAreaReq <= 0) return { n: 0, depth: 0, height: 0, perSide: 0, pitch: 0, lvEnd: 0, hvEnd: 0 };
  const depth = Math.min(400, Math.max(150, Math.round((d.tankH * 0.22) / 10) * 10));
  const height = Math.max(200, d.tankH - 240);
  const per = (2 * height * depth) / 1e6;
  const n = Math.max(4, Math.ceil(d.finAreaReq / per));
  /* MANUFACTURING.md section 7: perSide above is the CAD/drawing split
     (front tank wall vs back tank wall, an even split for pitch and
     placement) -- a different axis from lvEnd/hvEnd, which is how many
     fins or radiators end up nearer the LV bushing end of the tank versus
     the HV end, along its length. Bushings, the cable box and (on this
     model's OLTC/OCTC) the tap changer linkage crowd the LV end and leave
     less wall space there. The 1250 kVA sheet mounts 2 of its 6 radiators
     on the LV side and 4 on the HV side, a 1:2 split -- fitted from that
     one data point, so treat it as a starting allocation to check against
     the works' own tank layout, not a fact for every rating and fitting
     arrangement. */
  const hvEnd = n <= 1 ? n : Math.max(1, Math.round((n * 2) / 3));
  const lvEnd = n - hvEnd;
  const perSide = Math.ceil(n / 2);
  /* Same 85%-of-tankL usable wall length and even-spacing formula
     src/components/cad/geometry.ts's finPlacements() already draws from,
     kept in step by hand rather than imported (the engine takes no
     imports, invariant 1) so this pitch and the 3D/2D drawings' own pitch
     cannot read differently for the same design. */
  const pitch = (d.tankL * 0.85) / Math.max(1, perSide - 1 || 1);
  return { n, depth, height, perSide, pitch, per, lvEnd, hvEnd };
}

/* CALIBRATION.md section 24: radiator-tank equivalent of finLayout above,
   on a radiator's own geometry -- panels bolted into removable banks
   between top and bottom header pipes, not fins on a wall. Panel width
   (p.radiatorPanelWidth, default 520 mm, typical Indian pressed-steel
   practice) and pitch (p.radiatorPanelPitch) are both editable inputs,
   not derived, since they are a specific vendor's panel dimensions, the
   same way lamination width is a real slitting-stock decision rather
   than a continuous optimum (stepWidths' own increment). Panel height is
   the one dimension actually derived here: real pressed-steel elements
   come in a small set of standard heights, so the largest that clears
   the tank's own available vertical space is chosen, not a continuous
   figure -- the list itself is typical practice, not one vendor's
   specific catalogue. Bank count and panels-per-bank both come from the
   same finAreaReq every other cooling-surface figure in this engine
   already uses (CALIBRATION.md section 20's fan count and finLayout's
   own fin count both read it the same way) against one panel's own
   developed area, capped at p.radiatorPanelsPerBank panels before a
   second bank starts -- a handling/structural practicality, not a
   physical limit, and overridable. */
const RADIATOR_STANDARD_HEIGHTS = [600, 900, 1200, 1500, 1800, 2100];
function radiatorLayout(d) {
  const p = d.p;
  if (d.dry || d.finAreaReq <= 0) {
    return {
      totalPanels: 0, bankCount: 0, panelsPerBank: 0, panelWidth: p.radiatorPanelWidth, panelHeight: 0,
      panelPitch: p.radiatorPanelPitch, headerCentres: 0, valvesPerBank: 2, totalValves: 0, per: 0, lvBanks: 0, hvBanks: 0,
    };
  }
  const avail = Math.max(200, d.tankH - 240);
  const panelHeight = [...RADIATOR_STANDARD_HEIGHTS].reverse().find((h) => h <= avail) || RADIATOR_STANDARD_HEIGHTS[0];
  const panelWidth = p.radiatorPanelWidth;
  const per = (2 * panelHeight * panelWidth) / 1e6;
  const rawPanels = Math.max(2, Math.ceil(d.finAreaReq / per));
  const bankCount = Math.max(1, Math.ceil(rawPanels / p.radiatorPanelsPerBank));
  const panelsPerBank = Math.ceil(rawPanels / bankCount);
  const totalPanels = panelsPerBank * bankCount;
  /* Same LV/HV bank split as finLayout's own fin split, same reason
     (bushings, cable box and tap-changer linkage crowd the LV end) and
     the same 1250 kVA sheet's own 2:1 fitted ratio, one level up: banks
     instead of individual fins, since a radiator bank is what actually
     gets mounted and removed as a unit. */
  const hvBanks = bankCount <= 1 ? bankCount : Math.max(1, Math.round((bankCount * 2) / 3));
  const lvBanks = bankCount - hvBanks;
  return {
    totalPanels, bankCount, panelsPerBank, panelWidth, panelHeight,
    panelPitch: p.radiatorPanelPitch, headerCentres: panelHeight,
    valvesPerBank: 2, totalValves: bankCount * 2, per, lvBanks, hvBanks,
  };
}

/* CALIBRATION.md section 24: conservator sizing. Previously a BOM cost
   line (folded into the AC-01 fittings lump) with no dimensions at all --
   CostCardTab.tsx's own "Conservator Dimensions" card said as much ("the
   engine does not size a conservator... enter the works' own figures").
   Conventional practice sizes the conservator at about 10% of total oil
   volume (p.conservatorPct) to allow for thermal expansion across the
   rise range, mounted above the tank on its own brackets -- a horizontal
   cylinder, diameter and length solved from that volume at a fitted
   length-to-diameter ratio (p.conservatorAspect, 2.08, the one reference
   figure on file: the 630 kVA sheet's own 330 mm dia x 685 mm long,
   685/330 = 2.076). Only meaningful on a radiator tank -- a sealed fin
   tank has no conservator, per this engine's own existing "sealed fin
   tank... drops the conservator and breather maintenance" reasoning
   (impacts()). V = (pi/4) D^2 L, L = aspect x D, solved for D. */
function conservatorSize(d) {
  const p = d.p;
  if (d.dry || p.tankType !== "radiator") return { volumeL: 0, dia: 0, length: 0 };
  const volumeL = d.fluidLitres * (p.conservatorPct / 100);
  const volumeM3 = volumeL / 1000;
  const dia = Math.cbrt((4 * volumeM3) / (Math.PI * p.conservatorAspect)) * 1000;
  const length = dia * p.conservatorAspect;
  return { volumeL, dia, length };
}

/* MANUFACTURING.md section 1: real practice states taps as turn numbers
   along the winding with whole-turn steps, not the continuous percentage
   d.turnsPerStep implies -- the 1250 kVA sheet runs exactly 7 turns per
   step, 16 steps of 7 giving 112 turns, not turnsPerStep's raw 7.15.
   Rounding to a whole turn per step means a tap's real voltage misses its
   nominal percentage very slightly; etErrorPct reports that miss rather
   than rounding it away. The regulating section is centred in the winding,
   per the sheet's own stated reason (balances ampere-turns, limits axial
   short-circuit force on the section either side of it) -- the engine has
   no per-turn axial position yet (MANUFACTURING.md sections 5-6 add that),
   so "centred" is this schedule's own placement assumption, not a measured
   fact about a physical winding, and is reported as such. */
function tappingSchedule(d, p) {
  if (p.tapType === "none" || p.tapStep <= 0) {
    return { rows: [], wholeStepTurns: 0, regulatingTurns: 0, sectionStart: 0, sectionFinish: 0, turnsBelow: 0, turnsAbove: 0 };
  }
  const minusSteps = Math.round(p.tapMinus / p.tapStep);
  const plusSteps = Math.round(p.tapPlus / p.tapStep);
  const wholeStepTurns = Math.max(1, Math.round(d.turnsPerStep));
  const rows = [];
  for (let i = -minusSteps; i <= plusSteps; i++) {
    const turns = d.nHV + i * wholeStepTurns;
    const nominalPct = i * p.tapStep;
    const voltage = d.hvPh * (1 + nominalPct / 100);
    const et = voltage / turns;
    rows.push({
      position: i, isNormal: i === 0, turns,
      nominalPct: +nominalPct.toFixed(2), voltage,
      et, etErrorPct: ((et - d.et) / d.et) * 100,
    });
  }
  const totalTurns = d.nHVmax;
  const minTurns = rows[0].turns;
  const regulatingTurns = rows[rows.length - 1].turns - minTurns;
  const sectionStart = Math.round((totalTurns - regulatingTurns) / 2) + 1;
  const sectionFinish = sectionStart + regulatingTurns - 1;
  return {
    rows, wholeStepTurns, regulatingTurns, sectionStart, sectionFinish,
    turnsBelow: sectionStart - 1, turnsAbove: totalTurns - sectionFinish,
  };
}

/* MANUFACTURING.md sections 2 and 5: both windings now report the sheets'
   own "N conductors, axial x radial" notation, in the SAME field shape --
   parallel/arrangement/transposition -- so the winding schedule prints
   both the same way, not LV in prose and HV in a grid.

   LV's axCount/radCount (ENGINE_VERSION 1.6.0, designTransformer's own
   lvAxCount/lvRadCount) are real engine outputs, not a heuristic layered
   on afterward the way HV's split below still is: LV multi-layer strip
   construction was fitted directly against both reference sheets (630 kVA
   reaches 4 axial x 2 radial, an exact match to the sheet's own "8
   conductors in 4 axial by 2 radial"; 1250 kVA does not structurally
   match its sheet's 5 axial by 6 radial, recorded in deriveSpec's own
   lvStripAspect/lvStripMaxMM2 note).

   HV itself is still modelled as a single required cross-section
   (aHVreq), not a chosen number of parallel strands, so its split below
   remains a heuristic, not something the engine already derives
   elsewhere or something either reference design confirms: both come out
   well under HV_STRAND_MAX_MM2 (single strand, the plain axHV/rdHV the
   engine already computes), so multi-strand splitting is untested against
   real data. MANUFACTURING.md's own "10.75 x 3.5 ) 8, 4A x 2R" example is
   given as the SHEETS' notation convention to follow, not a confirmed
   number for either reference design's actual HV current -- at the
   1250 kVA reference this heuristic's own required area (14.3 mm^2) is
   nowhere near 8 strands' worth (301 mm^2 at 10.75 x 3.5), so that
   example cannot be the 1250 kVA sheet's real HV conductor, or is a
   different rating's. HV_STRAND_MAX_MM2 is therefore a generic practical
   ceiling for a single rectangular strand (windability, eddy loss in the
   strand), not a calibrated figure -- treat any split it produces as a
   heuristic for the works to confirm, more so than LV's own split above.
   Transposition required whenever more than two conductors sit in
   parallel radially, the sheets' own rule ("very important on both
   layers" for the notation example's 2-radial arrangement) -- applied to
   both windings now, not just HV. */
const HV_STRAND_MAX_MM2 = 37.6;
/* CALIBRATION.md section 41: axHV/rdHV/hvAxCount/hvRdCount are read
   directly off d here, not recomputed -- this used to run its own,
   independent copy of the split formula, which is exactly section 15's
   "two documents disagreeing" problem: the winding this schedule showed
   and the winding designTransformer actually sized (window height, radial
   build, resistance) were never guaranteed to be the same split. They
   agree by construction now, the same principle section 15 established
   for the core cutting chart's own limb term. */
function conductorSchedule(d, p) {
  const lvParallel = d.lvAxCount * d.lvRadCount;
  const lv = {
    bare: { w: +d.foilW.toFixed(2), t: +d.tLV.toFixed(3) },
    covered: { w: +d.foilW.toFixed(2), t: +(d.tLV + p.lvIns).toFixed(3) },
    layers: d.lvTurnLayers,
    construction: d.lvConstruction === "strip" ? "Multi-layer strip winding" : (d.lvTurnLayers > 1 ? "Multi-layer strip winding" : "Single continuous foil"),
    covering: `${p.lvIns.toFixed(2)} mm interleaved paper between turns`,
    parallel: lvParallel,
    arrangement: lvParallel > 1 ? `${d.lvAxCount}A x ${d.lvRadCount}R` : null,
    transposition: d.lvRadCount > 2,
    weight: { bare: +d.wLV.toFixed(1), covered: +d.wLVCovered.toFixed(1) },
  };

  const hvN = d.hvAxCount * d.hvRdCount;
  const hv = {
    bare: { w: +d.axHV.toFixed(2), t: +d.rdHV.toFixed(2) },
    covered: { w: +(d.axHV + p.hvPaper).toFixed(2), t: +(d.rdHV + p.hvPaper).toFixed(2) },
    covering: `${p.hvPaper.toFixed(2)} mm paper covering, on diameter`,
    parallel: hvN, arrangement: hvN > 1 ? `${d.hvAxCount}A x ${d.hvRdCount}R` : null,
    transposition: d.hvRdCount > 2,
    weight: { bare: +d.wHV.toFixed(1), covered: +d.wHVCovered.toFixed(1) },
  };
  return { lv, hv };
}

/* MANUFACTURING.md section 3: sized from geometry, never a fixed list --
   but only the 1250 kVA sheet gives worked numbers (tie rods 18 mm dia,
   635 mm long, 55 mm thread both ends, 8 off; core bolts 18 x 380, 8 off;
   foot plates 100 x 15 MS flat, 3 off; neutral busbar minimum 1500 mm^2,
   100 x 15 copper), so every scaling here is fitted from that ONE point
   against a geometric driver chosen for a defensible physical reason, not
   a curve fit -- ask for a second sheet at a different rating before
   trusting these far from ~1250 kVA:
     - rod/bolt diameter scales with sqrt(core mass), i.e. with clamping
       force on a constant-stress assumption.
     - tie rod length is the window height plus a 60 mm clamp allowance
       each end (513.8 + 120 = 633.8 mm against the sheet's 635).
     - core bolt length scales directly with window height (proportional
       to the sheet's own 380 mm at Hw = 513.8 mm).
     - rod/bolt quantity scales with core width, rounded to an even count
       (rods run in symmetric pairs), floor 4.
     - foot plate count is 3, one per limb, not scaled -- a fact about a
       3-limb core, not a fit.
   Material is deliberately not asserted here (stainless tie rods is one of
   MANUFACTURING.md's own shop-notes examples, section 8): that is works
   practice, entered once in the shop notes library, not computed per job.
   Core clamp channel section and hole positions, and lifting/pulling lug
   plate thickness, have no worked example in either sheet and no clean
   geometric derivation -- printed as "to be specified" rather than
   guessed, per CLAUDE.md's rule against inventing engineering data. */
const HW_REF = { wCore: 1709.3, Hw: 513.8, coreWidth: 1230.9, dCore: 271.7, rodDia: 18, rodLen: 635, boltLen: 380, footW: 100 };
function hardwareSchedule(d, p) {
  const evenRound = (x) => Math.max(4, 2 * Math.round(x / 2));
  const rodDia = Math.max(12, 2 * Math.round((HW_REF.rodDia * Math.sqrt(d.wCore / HW_REF.wCore)) / 2));
  const rodQty = evenRound((8 * d.coreWidth) / HW_REF.coreWidth);
  const tieRod = {
    dia: rodDia, length: Math.round(d.Hw + 120), threadLength: Math.round(rodDia * 3),
    qty: rodQty, material: "Per shop notes (stainless in both reference sheets)",
  };
  const coreBolt = {
    dia: rodDia, length: Math.round((HW_REF.boltLen * d.Hw) / HW_REF.Hw),
    qty: rodQty, material: tieRod.material,
  };
  const footPlate = {
    w: Math.round((HW_REF.footW * d.dCore) / HW_REF.dCore), t: 15, qty: 3, material: "MS flat",
  };
  const clampChannel = {
    length: Math.round(d.coreWidth), section: "to be specified", holePositions: "to be specified",
  };
  const lugs = { qty: "to be specified", plateThickness: "to be specified" };

  /* Neutral busbar. MANUFACTURING.md's own instruction gives the
     calculation (cross-section from LV current at the LV winding's own
     current density) -- this is that calculated MINIMUM, not a claim about
     what a works would actually fit. It gives 667 mm^2 at the 1250 kVA
     reference against the sheet's own 1500 mm^2, more than double, and
     that gap is not something to reproduce by fitting a fudge factor: a
     neutral busbar is conventionally sized for fault duty and mechanical
     robustness, not continuous-current density -- it carries a full
     phase-to-neutral fault current well above the small unbalance and
     triplen-harmonic current it sees in normal service, and has to survive
     the mechanical force of that fault without a current-density
     calculation ever entering into it. The engine has no fault-current or
     mechanical-force model for this piece, so it cannot derive the 1500
     mm^2 figure or anything like it -- printing the continuous-duty
     minimum with that explanation is the honest answer, not a padded
     number invented to match one sheet. See MANUFACTURING.md section 3. */
  const vg = parseVectorGroup(p.vector);
  let neutralBusbar = null;
  if (vg.lvNeutral) {
    const area = d.iLineLV / d.dLV;
    const t = 15, w = Math.max(25, Math.ceil(area / t / 5) * 5);
    neutralBusbar = { area: +area.toFixed(1), w, t, material: "Copper", note: "Calculated minimum from LV current at LV current density. Works practice commonly sizes the neutral busbar well above this, for fault duty and mechanical robustness rather than continuous current -- the 1250 kVA reference sheet's own figure (1500 mm2) is more than double this calculation." };
  }

  const deltaWire = [];
  if (vg.hv === "D") deltaWire.push({ side: "HV", w: +d.axHV.toFixed(2), t: +d.rdHV.toFixed(2), covering: `${p.hvPaper.toFixed(2)} mm paper` });
  if (vg.lv === "d") deltaWire.push({ side: "LV", w: +d.foilW.toFixed(2), t: +d.tLV.toFixed(3), covering: `${p.lvIns.toFixed(2)} mm interleaved paper` });

  return { tieRod, coreBolt, footPlate, clampChannel, lugs, neutralBusbar, deltaWire };
}

/* MANUFACTURING.md section 4: yoke insulation, phase barrier, foot plate
   and clamp insulation and the two cylinders (core-to-LV, LV-to-HV) are
   derivable from core and coil geometry now. Their piece counts (6, 4, 3,
   4) are constants for a conventional 3-limb stacked core -- both
   reference sheets use one, so there is nothing to scale them against, but
   a rectangular wound or amorphous core would need different counts this
   does not yet account for. HT spacers, common blocks, CEEDEE blocks, oil
   ducts and dovetail strips all depend on the axial disc/coil layout
   (MANUFACTURING.md section 6) and are printed with material and
   thickness only, quantity "to be specified", exactly as the file
   instructs -- not estimated. */
function insulationPieceList(d, p) {
  const derived = [
    { item: "Yoke insulation", material: "Pressboard", qty: 6, thickness: 3.0 },
    { item: "Phase barrier", material: "Pressboard", qty: 4, thickness: 3.0 },
    { item: "Foot plate insulation", material: "Pressboard", qty: 3, thickness: 3.0 },
    { item: "Core clamp insulation", material: "Pressboard", qty: 4, thickness: 3.0 },
    { item: "Core-to-LV cylinder", material: "Pressboard", qty: 3, thickness: p.cylThk, diameter: +(d.dCore + 2 * p.coreLvClr).toFixed(1), height: +d.hLV.toFixed(0) },
    { item: "LV-to-HV cylinder", material: "Pressboard", qty: 3, thickness: p.cylThk, diameter: +d.lvOD.toFixed(1), height: +d.hHV.toFixed(0) },
  ];
  const pending = [
    { item: "HT spacers", material: "Pressboard", qty: "to be specified", thickness: 1.5 },
    { item: "Common blocks", material: "Pressboard", qty: "to be specified", thickness: 8.0 },
    { item: "CEEDEE blocks", material: "Permawood", qty: "to be specified", thickness: null },
    { item: "Oil ducts", material: null, qty: "to be specified", thickness: null },
    { item: "Dovetail strips", material: null, qty: "to be specified", thickness: null },
  ];
  return { derived, pending };
}

/* MANUFACTURING.md section 5: a direct print of the multi-coil HV winding
   ENGINE_VERSION 1.5.0 added -- construction type, coil or disc count,
   turns per coil, layers per coil, turns per layer.

   d.layers (used for the radial-build calculation in designTransformer) is
   a ceiling -- Math.ceil(nHVmax / (numGroups * turnsPerLayer)) -- sized to
   the FULLEST group, not literally every group's own turn count. Printing
   numGroups copies of that ceiling would overstate the total by however
   many turns short of a full rectangle nHVmax actually is (44 discs at a
   flat 15 turns each would total 660, not the 628 the winding actually
   has). This spreads nHVmax across the groups as evenly as possible --
   most groups at floor(nHVmax/numGroups), the remainder at one more turns
   each -- so the printed schedule always sums to exactly nHVmax.

   That even spread is still this engine's own approximation, not the
   reference sheet's. The 1250 kVA sheet grades its 44 discs in five groups
   (6 at 13, 12 at 15, 8 at 14, 12 at 15, 6 at 13) specifically so the
   tap changer's regulating section falls in the thinner middle group --
   a deliberate design choice tied to where the tap section sits, not
   available here until the tap section's own placement (tappingSchedule,
   section 1) feeds into this split, which it does not yet. The schedule
   says so explicitly rather than letting a uniform 44-at-15 (or the
   correct-summing 12-at-15/32-at-14 this function actually prints) read
   as if it reproduced the sheet's own grading. */
function windingSchedule(d, p) {
  const hv = {
    construction: d.hvConstruction,
    label: d.hvConstruction === "crossover" ? "coil" : d.hvConstruction === "disc" ? "disc" : null,
    groups: d.numGroups, turnsPerLayer: d.turnsPerLayer, layersPerGroup: d.layers,
    totalTurns: d.nHVmax,
  };
  if (d.hvConstruction === "layer") {
    return {
      hv, groupRows: [],
      note: "Single continuous layer winding -- not a multi-coil construction, nothing to distribute across groups.",
    };
  }
  const base = Math.floor(d.nHVmax / d.numGroups);
  const extra = d.nHVmax - base * d.numGroups; // this many groups carry one extra turn
  const groupRows = [];
  for (let i = 0; i < d.numGroups; i++) {
    const turns = i < extra ? base + 1 : base;
    groupRows.push({ index: i + 1, turns, layers: Math.ceil(turns / d.turnsPerLayer) });
  }
  const label = hv.label;
  const note = `Turns spread as evenly as possible across ${d.numGroups} ${label}s to total ${d.nHVmax} exactly `
    + `-- ${extra} ${label}${extra === 1 ? "" : "s"} at ${base + 1} turns, ${d.numGroups - extra} at ${base}. `
    + `This is this engine's own even distribution, not the reference sheet's graded one: a real design varies `
    + `turns per ${label} deliberately, fewest at the tap changer's regulating section, to place that section `
    + `in the winding -- not yet done here, since it needs the tap section's own location (tappingSchedule) fed `
    + `into this split. Read the row-by-row turns below as this engine's model, not a copy of a real winding schedule.`;
  return { hv, groupRows, note };
}

const bushHeight = (um) => (um <= 1.1 ? 180 : um <= 12 ? 300 : um <= 24 ? 420 : um <= 36 ? 560 : um <= 52 ? 760 : 1100);

const DOC_STATUS = { done: "Generated", part: "Partial", need: "Needs input" };

function documentRegister(core, d, bom, project) {
  const N = (n) => `${project.docPrefix}-${project.tender || "ENQ"}-R${String(project.revision).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
  const r = (n, title, status, where, missing) => ({ no: n, doc: N(n), title, status, where, missing });
  return [
    r(1, "Design Input Sheet", "done", "Project panel and enquiry inputs"),
    r(2, "Complete Engineering Calculation Report", "part", "Calculations tab, 68 steps with formula, substitution and reference",
      "Centre of gravity, transport weight, mechanical stress on the clamping structure and detailed short-circuit force calculation are not modelled"),
    r(3, "Executive Design Summary", "done", "Report page 1"),
    r(4, "Customer Approval Drawing, GA", "part", "Drawing 9, outer general arrangement",
      "Foundation plan, wheel and rail gauge, and the approval signature block are not drawn"),
    r(5, "Internal Assembly Drawing", "part", "Drawing 10 and the 3D section view",
      "A dimensioned exploded 2D assembly is not produced; the 3D exploded view is the substitute"),
    r(6, "Core Manufacturing Drawing", "done", "Drawing 6, with the cutting schedule (21) and the cutting chart (22)",
      "Clamp bolt positions are indicative, not from your clamping standard. Drawing 22's three plate lengths are fitted to one reference chart, unconfirmed at other ratings"),
    r(7, "Winding Manufacturing Drawing", "part", "Drawings 7 and 8, LV and HV coils",
      "Disc and interleaved-disc constructions are not modelled; the engine builds foil LV and layer HV only"),
    r(8, "Insulation Schedule", "part", "Clearances panel and the coil drawings",
      "Grade-by-grade schedule for pressboard, DDP and Nomex, and creepage from the bushing catalogue, are not held"),
    r(9, "Tank Fabrication Drawing", "part", "Drawings 4, 5 and 9",
      "Plate cutting list, weld symbols, flange and stiffener details are not generated"),
    r(10, "Radiator Drawing", "part", "Fin or radiator geometry in drawing 9",
      "Panel sizes come from a generic layout, not a vendor radiator catalogue"),
    r(11, "Accessories Layout", "part", "3D model, fittings group",
      "Positions are indicative. Buchholz, OTI, WTI, MOG and CT selection need your accessory standard"),
    r(12, "Complete Bill of Materials", "part", "Costing tab, fully editable, item code/part number/supplier shown per line",
      "Per-line GST is not held -- the rate card applies GST once, at the overall ex-works total, not per BOM row"),
    r(13, "Material Requirement Planning", "need", "n/a",
      "Requires stock on hand, supplier master, lead times and open purchase orders. None of this exists in the platform"),
    r(14, "Manufacturing Process Sheet", "need", "n/a", "Requires your routing, standard times and work-centre list"),
    r(15, "Production Routing Sheet", "need", "n/a", "Requires machine list, operator allocation and standard times"),
    r(16, "Cost Estimation Report", "done", "Costing tab with the full build-up to selling price"),
    r(17, "Cost Comparison Report", "done", "Compare and quote tab"),
    r(18, "Supplier Comparison Report", "need", "n/a", "The supplier master now holds rates, lead time and rating (orgs/{orgId}/suppliers) -- only freight is not tracked. The comparison report itself is not yet built from that data"),
    r(19, "Quality Inspection Report", "need", "n/a", "Requires your quality assurance plan and inspection stages"),
    r(20, "Routine Test Report", "part", "Predicted values below",
      "Design values are generated as the expected result. Measured values must come from the test floor"),
    r(21, "Type Test Report", "need", "n/a", "Requires results from a test laboratory. Temperature rise, impulse and short-circuit results cannot be predicted as certificates"),
    r(22, "FAT Report", "need", "n/a", "Requires witnessed test results and customer sign-off"),
    r(23, "Packing List", "part", "Total mass and overall dimensions are known",
      "Packaging scheme, case sizes and accessory crating are not modelled"),
    r(24, "Name Plate", "done", "Name plate drawing below"),
    r(25, "Dispatch Documents", "need", "n/a", "Requires commercial data: invoice terms, warranty text, transport booking"),
    r(26, "Revision Report", "part", "Revisions modal: save, duplicate, delete, lock and read-only history browsing",
      "Revisions are stored and browsable (TASKS.md item 5) -- a formatted revision-history report (what changed, between which revisions, by whom) is not generated as a document, though the data to build it from now exists"),
    r(27, "Compliance Report", "part", "Compliance block on the design sheet",
      "Losses, impedance, temperature rise and ratio error are checked. A clause-by-clause report needs the licensed standard text"),
    // TASKS.md item 10: server-side pipeline landed -- generateReportPdf
    // (functions/src/reportPdf.ts) renders src/report/PrintReport.tsx
    // headlessly with a signed Firebase custom token, uploads to Storage,
    // records the document, all triggered from the "PDF Report" panel on
    // this tab, not the old client-side window.print() button. Bookmarks,
    // page numbers, revision and QR code are all real now (CLAUDE.md
    // invariant 7 -- this row's own "missing" text was the thing that made
    // that check necessary here). Digital signature is the one item from
    // the original gap list still genuinely absent -- cryptographic PDF
    // signing is a distinct capability TASKS.md item 10 itself never asked
    // for, not an oversight in this pass.
    r(28, "PDF Generation", "part", "PDF Report panel, Reports & Docs tab",
      "Digital signature is not applied -- cryptographic PDF signing, not built"),
  ];
}

function routineTestSchedule(d) {
  const p = d.p;
  const rows = [
    { t: "Voltage ratio at all taps", ref: "IEC 60076-1", exp: `${f3((d.nHV / d.nLV))} turns ratio, error ${f3(d.ratioErr)} %`, lim: "\u00B10.5 % of declared" },
    { t: "Vector group and polarity", ref: "IEC 60076-1", exp: p.vector, lim: "As declared" },
    { t: "Winding resistance HV", ref: "IEC 60076-1", exp: `${f3(d.rHV)} \u03A9 per phase at ${d.refT} \u00B0C`, lim: "Record, correct to reference temperature" },
    { t: "Winding resistance LV", ref: "IEC 60076-1", exp: `${d.rLV.toExponential(3)} \u03A9 per phase at ${d.refT} \u00B0C`, lim: "Record" },
    { t: "No-load loss and current at rated voltage", ref: "IEC 60076-1", exp: `${f0(d.noLoad)} W, ${f2(d.i0pct)} %`, lim: `${f0(d.sch.nll)} W guaranteed, +${d.std.lossTolPart} % on test` },
    {
      t: `Load loss and impedance at principal tap${p.dualRating && p.kva2 > 0 ? `, stated at ${p.kva} kVA (${p.cooling}) only` : ""}`,
      ref: "IEC 60076-1", exp: `${f0(d.loadLoss)} W, ${f2(d.pctZ)} %`, lim: `${f0(d.sch.ll)} W guaranteed, impedance \u00B1${p.zTol} %`,
    },
    { t: "Separate source AC withstand, HV", ref: "IEC 60076-3", exp: `${p.acHV} kV for 60 s`, lim: "No breakdown" },
    { t: "Separate source AC withstand, LV", ref: "IEC 60076-3", exp: `${p.acLV} kV for 60 s`, lim: "No breakdown" },
    { t: "Induced overvoltage withstand", ref: "IEC 60076-3", exp: "Twice rated voltage, duration per clause", lim: "No breakdown" },
    { t: "Insulation resistance", ref: "Works practice", exp: "Record HV-E, LV-E, HV-LV", lim: "Record" },
    { t: "Oil dielectric strength", ref: "IEC 60296", exp: d.dry ? "Not applicable" : "Sample before and after filling", lim: d.dry ? "n/a" : "60 kV minimum" },
  ];
  /* CALIBRATION.md section 21: dual rating is not a second independent
     load-loss test -- IEC 60076-1 practice is one measurement, at the
     principal tap and the rating the row above is already taken at; the
     second rating's figure is a calculated derating of that one
     measurement, load loss scaling with current squared, not a separately
     guaranteed test point. Reported here as "calculated", not "guaranteed
     on test", so the GTP does not overstate what routine test actually
     covers for a dual-rated unit. */
  if (p.dualRating && p.kva2 > 0 && d.dualCompliance) {
    rows.push({
      t: `Load loss at second rating, ${p.kva2} kVA (${p.cooling2}) -- calculated, not separately tested`,
      ref: "IEC 60076-1", exp: `${f0(d.dualLoadLoss)} W`, lim: `${f0(p.limitLL2)} W guaranteed`,
    });
    /* CALIBRATION.md section 22: %Z is referenced to whichever rating's
       current the design was built to (p.kva) -- a real dual-rated unit
       has a second, genuinely different %Z at kva2's own current (%Z
       scales with rated current at fixed voltage), and a protection
       engineer sizing relays or fault studies off the second rating needs
       that figure. Not computed here -- flagged on the GTP rather than
       left unstated, since a blank would read as "no second impedance
       exists" rather than "not yet built". */
    rows.push({
      t: `Impedance at second rating, ${p.kva2} kVA (${p.cooling2}) -- not stated`,
      ref: "Known gap, CALIBRATION.md section 22",
      exp: "Not calculated by this engine",
      lim: `Referenced to ${p.kva2} kVA's own current, not ${p.kva} kVA's; do not use the ${f2(d.pctZ)} % above for protection studies at the ${p.kva2} kVA point`,
    });
  }
  return rows;
}



/* ------------------------------------------------------------------
   Public API
   ------------------------------------------------------------------ */

export {
  CONDUCTORS, CORE_GRADES, CORE_TYPES, STEP_UTIL, UM_LEVELS, FLUIDS, DRY_TYPES,
  INS_CLASS, STANDARDS, APPS, EFF_LEVELS, ESSENTIALS, DEFAULT_RATES, UM_STEPS,
  lossSchedule, clearancesFrom, umFor, zSuggest, gradeSuggest, fluxSuggest,
  stepsSuggest, densitySuggest, aspectSuggest,
  deriveSpec, designTransformer, buildBOM, ownershipCost, searchDesigns, stagedSearchDesigns,
  impacts, calcSheet, stepWidths, stampingSchedule, finLayout, radiatorLayout, conservatorSize,
  documentRegister, routineTestSchedule, DOC_STATUS, REFS,
  inr, lakhs, bushMul, condRate, rkCond, fluxRange, bushHeight, parseVectorGroup,
  etkCurve, fitEtkToCost, ETK_RANGE,
  tappingSchedule, conductorSchedule, hardwareSchedule, insulationPieceList, windingSchedule,
  cardCostModel, DEFAULT_CARD_RATES, coreCuttingChart,
};

export function computeDesign(core, over = {}, rates = DEFAULT_RATES, extras = []) {
  const spec = deriveSpec(core, over);
  // CALIBRATION.md section 38: autoFitConverged is reporting, not a design
  // parameter -- kept off of p/fitted so it never reaches designTransformer,
  // same as etkSearchNote/etkNonCompliant below. Absent (autoFit off, or
  // both flux and density locked) reads as converged: there was nothing to
  // fail to converge.
  const { autoFitConverged, ...fitted } = fitToSchedule(spec.S, over);
  const p0 = { ...spec.S, ...fitted };
  // CALIBRATION.md section 2: runs after fitToSchedule so the K search sees
  // the same flux and current density the actual build will use, and before
  // designTransformer so an AUTO etK is never built at deriveSpec's raw
  // fixed-multiplier guess when the project's own rates say otherwise.
  // etkSearchNote/etkNonCompliant (no compliant K found) are reporting, not
  // design parameters -- kept off of p/fitted so they never reach
  // designTransformer. etkFitConverged (section 39) is the WINNING K's own
  // fit convergence -- supersedes autoFitConverged above, which was for
  // whatever K fitToSchedule started from and fitEtkToCost may have since
  // moved away from. Only present when fitEtkToCost actually ran (etK was
  // AUTO, not locked) -- undefined otherwise, in which case the original
  // autoFitConverged is the right, and only, answer.
  const { etkSearchNote, etkNonCompliant, etkFitConverged, ...etkOverride } = fitEtkToCost(p0, over, rates);
  const fittedAll = { ...fitted, ...etkOverride };
  const p = { ...p0, ...etkOverride };
  const design = designTransformer(p);
  const bom = buildBOM(design, rates, extras);
  const finalConverged = etkFitConverged !== undefined ? etkFitConverged : autoFitConverged;
  return {
    spec, params: p, fitted: fittedAll, design, bom, engineVersion: ENGINE_VERSION, etkSearchNote,
    etkNonCompliant: !!etkNonCompliant, autoFitConverged: finalConverged !== false,
  };
}

/* CALIBRATION.md section 38: this loop used to take a full, undamped
   correction step every iteration for a fixed 10 iterations, no
   convergence check at all -- whatever flux/deltaLV/deltaHV it held after
   iteration 10 was returned, converged or not, with no way to tell which.
   Raising the margin targets (section 37) surfaced a real, pre-existing
   fault this had been hiding: at some ratings (1250 kVA specifically,
   traced in detail) the load-loss correction does not settle to a fixed
   point at all. The cause is not flux and density fighting each other --
   flux was found pinned dead flat at the grade ceiling the whole time,
   not moving. It is the density correction chasing a DISCONTINUITY in
   designTransformer's own geometry: lvAxCount/lvRadCount (the LV parallel-
   conductor split) flips between two configurations (4x6 and 5x5 in the
   traced case) at nearly identical deltaLV, each giving a meaningfully
   different load loss for the same current density. The corrector
   overshoots across that threshold every pass -- traced to a clean
   period-6 cycle, hundreds of watts wide, never narrowing.

   Fixed two ways. First, damping (RELAX = 0.6): each iteration moves only
   60% of the way from the current value to what an undamped correction
   would ask for, the standard remedy for a fixed-point iteration
   overshooting past a target repeatedly -- a smaller step is less likely
   to cross a threshold it would otherwise bounce off on both sides.
   Second, and more important: the loop now exits on an actual convergence
   check (flux, deltaLV and deltaHV all within CONVERGE_TOL relative spread
   across the last CONVERGE_WINDOW iterations), not a fixed count, and
   caps at MAX_ITERS as a safety bound rather than a target -- checked
   across six ratings (100 to 5000 kVA) with the new margin targets, five
   settle cleanly in 5-15 iterations; 1250 kVA does not settle within 60
   even damped, confirming this is a genuine structural difficulty at that
   specific configuration, not a tuning artefact fixable by adjusting the
   damping factor or the tolerance. When that happens the loop still
   returns its last values, usable but not exact -- and sets
   autoFitConverged: false so this is visible on the design, the same
   principle etkNonCompliant already established: a result that failed to
   settle must never be indistinguishable from one that did. */
const FIT_RELAX = 0.6, FIT_MAX_ITERS = 60, FIT_CONVERGE_WINDOW = 5, FIT_CONVERGE_TOL = 0.002;
/* CALIBRATION.md section 39: maxIters/tol are overridable so etkCurve can
   scan many K candidates at a loose, fast tolerance purely to rank them,
   then run ONE final call at the real (tight) precision for whichever K
   wins -- never comparing candidates on a stale fit (section 39's original
   fault), but not paying full convergence cost for every candidate a
   ranking pass immediately discards either. The default (no args) is
   still the full-precision fit computeDesign's own main path uses. */
export function fitToSchedule(S, over = {}, maxIters = FIT_MAX_ITERS, tol = FIT_CONVERGE_TOL) {
  if (!S.autoFit) return {};
  const lockF = over.flux !== undefined;
  const lockD = over.deltaLV !== undefined || over.deltaHV !== undefined;
  if (lockF && lockD) return {};
  const bMax = CORE_GRADES[S.coreGrade].bMax - 0.02;
  const bMin = S.coreGrade === "amor" ? 1.20 : 1.42;
  const cl = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  let flux = S.flux, dLV = S.deltaLV, dHV = S.deltaHV;
  const window = [];
  let converged = false;
  for (let i = 0; i < maxIters; i++) {
    const t = designTransformer({ ...S, flux, deltaLV: dLV, deltaHV: dHV });
    window.push({ flux, dLV, dHV });
    if (window.length > FIT_CONVERGE_WINDOW) window.shift();
    if (window.length === FIT_CONVERGE_WINDOW) {
      const spread = (arr) => (Math.max(...arr) - Math.min(...arr)) / Math.max(...arr.map(Math.abs), 1e-6);
      if (spread(window.map((w) => w.flux)) < tol
        && spread(window.map((w) => w.dLV)) < tol
        && spread(window.map((w) => w.dHV)) < tol) { converged = true; break; }
    }
    if (!lockF && t.noLoad > 0) {
      const fluxTarget = cl(flux * Math.pow(Math.pow((S.marginTargetNLL * t.sch.nll) / t.noLoad, 1 / 0.9), 0.55), bMin, bMax);
      flux += FIT_RELAX * (fluxTarget - flux);
    }
    if (!lockD && t.loadLoss > 0) {
      const k = Math.pow((S.marginTargetLL * t.sch.ll) / t.loadLoss, 0.6);
      const dLVTarget = cl(dLV * k, 0.7, CONDUCTORS[S.condLV].dMax);
      const dHVTarget = cl(dHV * k, 0.7, CONDUCTORS[S.condHV].dMax);
      dLV += FIT_RELAX * (dLVTarget - dLV);
      dHV += FIT_RELAX * (dHVTarget - dHV);
    }
  }
  const r2 = (x) => Math.round(x * 100) / 100;
  // A locked dimension never moves in this loop, so it trivially satisfies
  // the window-spread check above -- autoFitConverged correctly reflects
  // whichever dimension is actually being fitted, locked or not.
  const o = { autoFitConverged: converged };
  if (!lockF) o.flux = r2(flux);
  if (!lockD) { o.deltaLV = r2(dLV); o.deltaHV = r2(dHV); }
  return o;
}

export function summarise(core, design, bom) {
  return {
    kva: core.kva, hv: core.hv, lv: core.lv,
    exWorks: Math.round(bom.exFactory),
    delivered: Math.round(bom.withGst),
    noLoadLoss: Math.round(design.noLoad),
    loadLoss: Math.round(design.loadLoss),
    impedance: +design.pctZ.toFixed(2),
    efficiency: +design.eff100.toFixed(3),
    totalMass: Math.round(design.wCore + design.wLV + design.wHV + design.wIns +
      design.wFrame + design.wTank + design.wFin + design.wEnclosure +
      design.fluidLitres * design.fluid.dens),
    compliant: design.compliant,
    engineVersion: ENGINE_VERSION,
  };
}
