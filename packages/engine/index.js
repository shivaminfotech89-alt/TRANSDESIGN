/**
 * Transformer design engine.
 *
 * Pure functions only: no React, no Firebase, no DOM. Everything the platform
 * shows is derived from these, so nothing downstream can hold a stale number.
 *
 * ENGINE_VERSION is stamped onto every saved revision. Never change a formula
 * without bumping it, or old quotations stop reproducing.
 */

export const ENGINE_VERSION = "1.3.0";

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

/* Application presets */
const APPS = {
  distribution: { name: "Distribution", etK: 0.45, z: 5.0, stray: 12, tap: "octc", cool: "ONAN" },
  power: { name: "Power", etK: 0.53, z: 10.0, stray: 15, tap: "oltc", cool: "ONAF" },
  rectifier: { name: "Rectifier / converter duty", etK: 0.50, z: 8.0, stray: 24, tap: "octc", cool: "ONAN" },
  furnace: { name: "Furnace duty", etK: 0.50, z: 7.0, stray: 26, tap: "oltc", cool: "OFAF" },
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
function lossSchedule(kva, level, dry) {
  const m = (EFF_LEVELS[level] || EFF_LEVELS.level2).mul;
  const kn = dry ? 1.45 : 1, kl = dry ? 1.20 : 1;
  return { nll: 4.6 * Math.pow(kva, 0.805) * m * kn, ll: 52 * Math.pow(kva, 0.766) * m * kl };
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
  dualHV: false, hv2: 22000, dualLV: false, lv2: 415,
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
    put("cooling", kva <= 5000 ? "ONAN" : "ONAF", null, [["ONAN", "ONAN"], ["ONAF", "ONAF"], ["OFAF", "OFAF"], ["ODAF", "ODAF"]], "Natural circulation is normal up to about 5 MVA.");
    put("tankType", kva <= 2500 ? "fin" : "radiator", null, [["fin", "Corrugated fin, sealed"], ["radiator", "Radiator + conservator"]], "Fin tanks up to about 2500 kVA, radiators above that.");
    put("oilRiseTarget", Math.min(std.oilRise, FLUIDS[fl].riseLimit), [30, Math.min(std.oilRise, FLUIDS[fl].riseLimit), 1], null, `Design to the ${std.name} limit. Lower means more cooling surface and more cost.`);
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
  put("aspect", aspectSuggest(umHV), [2.0, 3.8, 0.05], null, "Starting window shape. The final height is solved to hit the declared impedance unless you turn that off.");
  put("autoWindow", true, null, [[true, "Solve height for the declared impedance"], [false, "Use the output equation only"]], "With this on, the window height is adjusted until the calculated impedance matches the declared value, which is what a designer does by hand.");
  put("autoFit", true, null, [[true, "Fit flux and current density to the loss limits"], [false, "Use the rating-based values only"]], "With this on, the flux density and the current densities are trimmed until the calculated losses sit just inside the declared limits, the cheapest core and coil that still passes.");
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

  /* --- construction constants --- */
  put("lvIns", 0.30, [0.10, 1.20, 0.05], null, "Interturn insulation on the LV foil or strip.");
  put("hvPaper", 0.45, [0.20, 1.50, 0.05], null, "Paper covering on the HV conductor, on diameter.");
  put("hvInterlayer", Math.round((0.3 + 0.004 * S.bilHV) * 10) / 10, [0.2, 4.0, 0.1], null, "Interlayer insulation in the HV coil, from the volts per layer.");
  put("insFactor", 4.5, [2.5, 7.0, 0.1], null, "Multiplier that converts the cylinder volume into total insulation mass.");
  put("topOilSpace", dry ? 300 : Math.round(150 + 0.8 * S.bilHV), [100, 500, 10], null, "Space above the core for leads, the top oil level and the cover.");
  put("bottomClr", 60, [30, 150, 5], null, "Core bottom frame to tank floor.");
  put("finDiss", 250, [180, 400, 10], null, "Fin or radiator dissipation at 50 K rise. Calibrate it from your own heat-run results.");
  put("tankDiss", 300, [200, 450, 10], null, "Plain tank wall dissipation at 50 K rise.");
  put("airDiss", 3.2, [2.0, 5.0, 0.1], null, "Dry-type coil surface dissipation coefficient.");

  /* --- economics --- */
  put("tariff", 8.0, [3, 15, 0.25], null, "Energy tariff used to value the losses over the life.");
  put("years", 20, [5, 35, 1], null, "Evaluation period for the cost of ownership.");
  put("loadFactor", 0.60, [0.2, 1.0, 0.05], null, "Average loading. Load loss scales with the square of this.");
  put("pf", 1.0, [0.7, 1.0, 0.05], null, "Power factor used for efficiency and regulation.");

  return { S, SUG, RNG, OPT, NOTE };
}

const DEFAULT_RATES = {
  core: 305, condCu: 1050, condAl: 340, condCca: 560, insulation: 385,
  frameMS: 98, tankMS: 118, fin: 152, radiator: 168, fluid: 135,
  paint: 340, bushHV: 2400, bushLV: 1900, octc: 9500, oltc: 465000, dualLink: 12000,
  cableBox: 18000, fittings: 26000, plateSet: 3500, resin: 380, enclosure: 155,
  labWind: 65, labCore: 22, labTank: 34, assembly: 42000,
  overheadPct: 12, scrapPct: 2.5, freight: 22000, marginPct: 11, gstPct: 18,
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

    /* LV: full-height foil where the thickness is practical, otherwise a
       helical strip winding in several radial layers */
    const wFull = Math.max(20, hLV - 10);
    let foilW, tLV, lvTurnLayers;
    if (aLVreq / wFull >= T_MIN) {
      foilW = wFull; tLV = aLVreq / wFull; lvTurnLayers = nLV;
    } else {
      tLV = T_MIN; foilW = aLVreq / T_MIN;
      const perAxial = Math.max(1, Math.floor(hLV / (foilW + 2)));
      lvTurnLayers = Math.ceil(nLV / perAxial);
    }
    let lvRadial = lvTurnLayers * (tLV + p.lvIns);
    lvRadial += (lvRadial > 22 ? 2 : 1) * 6;

    /* HV: layer winding */
    let axHV, rdHV;
    if (aHVreq > 6) { rdHV = Math.sqrt(aHVreq / 2.1); axHV = 2.1 * rdHV; }
    else { const dia = Math.sqrt((4 * aHVreq) / Math.PI); axHV = dia; rdHV = dia; }
    const turnsPerLayer = Math.max(1, Math.floor(hHV / (axHV + p.hvPaper)));
    const layers = Math.max(1, Math.ceil(nHVmax / turnsPerLayer));
    const hvDucts = Math.min(2, Math.floor(layers / 6));
    const hvRadial = layers * (rdHV + p.hvPaper) + (layers - 1) * p.hvInterlayer + hvDucts * 6;

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
  const yokeDepth = shape === "circ" ? 0.86 * dCore : coreD;
  const wCore = aGross * (3 * (Hw / 1000) + 2 * ((2 * g.cc + (shape === "circ" ? dCore : coreD)) / 1000)) * 7650;
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
    const forced = p.cooling === "ONAF" ? 1.5 : p.cooling === "OFAF" || p.cooling === "ODAF" ? 2.1 : 1.0;
    forcedMul = forced;
    /* the cooling surface must satisfy the top-oil limit AND the winding limit */
    const target = Math.max(20, Math.min(p.oilRiseTarget, riseLimit, (wRiseLimit - grad) / 0.8));
    riseTarget = target;
    tankDissip = kTank * tankArea * Math.pow(target, 1.25);
    finAreaReq = Math.max(0, (totalLoss - tankDissip) / (kFin * forced * Math.pow(target, 1.25)));
    oilRise = Math.pow(totalLoss / (kTank * tankArea + kFin * forced * finAreaReq), 1 / 1.25);
    wFin = (finAreaReq / 2) * 0.0012 * 7850 * (p.tankType === "fin" ? 1.18 : 1.55);
    const tPlate = p.kva > 2500 ? 0.006 : 0.005;
    wTank = (tankArea * tPlate + capArea * (tPlate + 0.001)) * 7850 * 1.28;
    const tankVol = (tankL * tankW * tankH) / 1e9;
    const activeVol = wCore / 7650 + wLV / cLV.dens + wHV / cHV.dens + wIns / 1150 + wFrame / 7850;
    fluidLitres = Math.max(30, (tankVol - activeVol) * 1000 * (p.tankType === "fin" ? 1.10 : 1.22));
    windRise = 0.8 * oilRise + grad;
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

  const sch = p.effLevel === "custom" ? { nll: p.limitNLL, ll: p.limitLL } : lossSchedule(p.kva, p.effLevel, dry);
  const compliance = {
    nll: { val: noLoad, lim: sch.nll, ok: noLoad <= sch.nll },
    ll: { val: loadLoss, lim: sch.ll, ok: loadLoss <= sch.ll },
    total: { val: totalLoss, lim: sch.nll + sch.ll, ok: totalLoss <= sch.nll + sch.ll },
    z: { val: g.pctZ, lim: p.targetZ, ok: Math.abs(g.pctZ - p.targetZ) / p.targetZ <= Math.min(p.zTol, std.zTol) / 100 },
    rise: { val: dry ? windRise : oilRise, lim: riseLimit, ok: (dry ? windRise : oilRise) <= riseLimit + 0.5 },
    wRise: { val: windRise, lim: wRiseLimit, ok: windRise <= wRiseLimit + 0.5 },
    ratio: { val: Math.abs(ratioErr), lim: 0.5, ok: Math.abs(ratioErr) <= 0.5 },
    volley: { val: g.voltsPerLayer, lim: p.acHV * 1000 * 0.6, ok: g.voltsPerLayer * 2 <= p.acHV * 1000 * 0.6 },
  };
  const compliant = Object.values(compliance).every((x) => x.ok);

  return {
    p, grade, ct, std, fluid, dryT, cls, dry, B, cLV, cHV, dLV, dHV, clr, refT, shape, solvedZ,
    hvConn, lvConn, hvPh, lvPh, hvDesign, lvDesign, iLineHV, iLineLV, iHV, iLV,
    et, nLV, nHV, nHVmax, ratioErr, tapSteps, turnsPerStep,
    aNet: aNet * 1e4, aGross: aGross * 1e4, dCore, coreW, coreD, Hw, Ww: g.Ww, cc: g.cc,
    aLVreq, aHVreq, tLV: g.tLV, foilW: g.foilW, lvRadial: g.lvRadial, hvRadial: g.hvRadial,
    layers: g.layers, turnsPerLayer: g.turnsPerLayer, axHV: g.axHV, rdHV: g.rdHV, voltsPerLayer: g.voltsPerLayer,
    lvID: g.lvID, lvOD: g.lvOD, hvID: g.hvID, hvOD: g.hvOD, lmtLV: g.lmtLV, lmtHV: g.lmtHV, hLV: g.hLV, hHV: g.hHV,
    wLV, wHV, wCore, wIns, wFrame, wTank, wFin, wEnclosure, fluidLitres, coilArea,
    coreHeight, coreWidth, yokeDepth, tankL, tankW, tankH, tankArea, finAreaReq,
    wPerKg, noLoad, loadLoss, totalLoss, i0pct, i2rLV: g.i2rLV, i2rHV: g.i2rHV, rLV: g.rLV, rHV: g.rHV,
    pctX: g.pctX, pctR: g.pctR, pctZ: g.pctZ, regFull, oilRise, windRise, grad, hotspot, hotspotAvg, lifeFactor,
    riseLimit, wRiseLimit, eff100: effAt(1), eff75: effAt(0.75), eff50: effAt(0.5), maxEffLoad,
    iscLV: iLV * iscMult, iscHV: iHV * iscMult, iscMult, noise, sch, compliance, compliant,
    Kw, aWin, Hw0, util: shape === "circ" ? (STEP_UTIL[p.steps] || 0.94) : ct.aspect, sf: grade.sf,
    kTank, kFin, tankDissip, riseTarget, forcedMul, vaPerKg,
    rhoLV: rho(cLV), rhoHV: rho(cHV), dEff: g.dEff, hEff: g.hEff, X: g.X, lmtMean: g.lmtMean,
    lvTurnLayers: g.lvTurnLayers, hvDucts: g.hvDucts, i2r: g.i2rLV + g.i2rHV,
    tLVin: g.tLVin, tLVout: g.tLVout, tHVin: g.tHVin, tHVout: g.tHVout,
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
    { code: "WD-02", desc: `HV winding \u2013 ${d.cHV.name}, ${d.layers} layers`, qty: d.wHV, unit: "kg", rate: condRate(p.condHV, r), rk: rkCond(p.condHV) },
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

  return {
    segments: [
      { title: "A: Core & coil assembly", rows: A, total: matA },
      { title: d.dry ? "B: Enclosure & finishing" : "B: Tank, cooling & fluid", rows: Bseg, total: matB },
      { title: "C: Accessories & terminations", rows: Cseg, total: matC },
      ...(extras.length ? [{ title: "D: Additional items", rows: extras, total: extraCost }] : []),
    ],
    labour, material, labourCost, scrap, overhead, freight: r.freight,
    factory, works, margin, exFactory, gst, withGst: exFactory + gst, energy,
    tco: exFactory + energy.total,
  };
}

function ownershipCost(d, p) {
  const hrs = 8760 * p.years;
  const kwhNoLoad = (d.noLoad * hrs) / 1000;
  const kwhLoad = (d.loadLoss * p.loadFactor * p.loadFactor * hrs) / 1000;
  return { kwhNoLoad, kwhLoad, noLoad: kwhNoLoad * p.tariff, load: kwhLoad * p.tariff, total: (kwhNoLoad + kwhLoad) * p.tariff };
}

/* ============================================================
   BUDGET SEARCH
   ============================================================ */

function fluxRange(gradeKey) {
  if (gradeKey === "amor") return [1.25, 1.30, 1.35, 1.40];
  return [1.50, 1.55, 1.60, 1.65, 1.70, 1.75, 1.80].filter((b) => b <= CORE_GRADES[gradeKey].bMax);
}

function searchDesigns(base, rates, band, opts) {
  const results = [];
  const grades = opts.grades.length ? opts.grades : [base.coreGrade];
  const conds = opts.conds.length ? opts.conds : [base.condLV];
  const tanks = opts.tanks.length ? opts.tanks : [base.tankType];
  const cores = opts.cores.length ? opts.cores : [base.coreType];
  const dScales = [0.72, 0.80, 0.88, 0.95, 1.03, 1.12, 1.22, 1.32];
  const gapScales = [0.9, 1.0, 1.12];
  const riseTargets = opts.allowHotter ? [45, 50] : [base.oilRiseTarget];

  for (const core of cores) {
    const ctd = CORE_TYPES[core];
    for (const g of grades) {
      if (ctd.grades === "amor" && g !== "amor") continue;
      if (ctd.grades === "crgo" && g === "amor") continue;
      for (const B of fluxRange(g)) {
        for (const cond of conds) {
          // anchor the current-density ladder on the conductor being tried, not on the
          // one already in the design: aluminium needs a far lower density than copper
          const anchLV = cond === base.condLV ? base.deltaLV : densitySuggest(base.kva, cond, base.medium === "dry", false);
          const anchHV = cond === base.condHV ? base.deltaHV : densitySuggest(base.kva, cond, base.medium === "dry", true);
          for (const ds of dScales) {
            for (const tk of tanks) {
              for (const gs of gapScales) {
                for (const rt of riseTargets) {
                  const cand = {
                    ...base, coreType: core, buildFactor: ctd.bf, coreGrade: g, flux: B,
                    condLV: cond, condHV: cond,
                    deltaLV: Math.min(anchLV * ds, CONDUCTORS[cond].dMax),
                    deltaHV: Math.min(anchHV * ds, CONDUCTORS[cond].dMax),
                    autoClearance: false, tankType: tk, oilRiseTarget: rt,
                    lvHvClr: Math.round(base.lvHvClr * gs),
                  };
                  const d = designTransformer(cand);
                  if (!isFinite(d.wCore) || d.wCore <= 0) continue;
                  const bom = buildBOM(d, rates);
                  const zOk = Math.abs(d.pctZ - base.targetZ) / base.targetZ <= opts.zTol / 100;
                  const thermalOk = d.compliance.rise.ok && d.compliance.wRise.ok;
                  const lossOk = !opts.enforceLimits || (d.compliance.nll.ok && d.compliance.ll.ok);
                  results.push({
                    inputs: cand, d, bom, price: bom.exFactory, tco: bom.tco,
                    zOk, thermalOk, lossOk, feasible: zOk && thermalOk && lossOk,
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
  const best = new Map();
  for (const x of results) {
    const k = [x.inputs.coreType, x.inputs.coreGrade, x.inputs.condLV, x.inputs.tankType,
      x.d.B.toFixed(2), x.d.dLV.toFixed(2), x.d.dHV.toFixed(2)].join("|");
    const prev = best.get(k);
    if (!prev || x.tco < prev.tco) best.set(k, x);
  }
  return [...best.values()];
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
    row("Turns per layer", "n\u2097", "n\u2097 = floor(h\u2081 / (ax + paper))", `= floor(${n(d.hHV, 0)} / (${n(d.axHV)} + ${n(p.hvPaper)}))`, `${d.turnsPerLayer}`, REFS.B, "coil height, conductor size"),
    row("Number of layers", "L", "L = ceil(N\u2081\u2098\u2090\u2093 / n\u2097)", `= ceil(${d.nHVmax} / ${d.turnsPerLayer})`, `${d.layers}`, REFS.B, "HV turns, turns per layer"),
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
    row("Core weight", "W\u1da0\u2091", "W = \u03C1\u1da0\u2091 A\u1D4D [3H\u1D65\u1D65 + 2(2C + d)]", `= 7650 \u00D7 ${n(d.aGross / 1e4, 5)} \u00D7 [3\u00D7${n(d.Hw / 1000, 3)} + 2(2\u00D7${n(d.cc / 1000, 3)} + ${n(d.dCore / 1000, 3)})]`, `${n(d.wCore, 1)} kg`, REFS.S, "core area, window height, limb spacing"),
    row("No-load loss", "P\u2080", "P\u2080 = w \u00D7 W\u1da0\u2091", `= ${n(d.wPerKg, 3)} \u00D7 ${n(d.wCore, 1)}`, `${n(d.noLoad, 0)} W`, REFS.IS1180, "specific loss, core weight"),
    row("Exciting volt-amperes", "VA/kg", "VA/kg = va\u1D63\u2091\u1da0 (B/B\u1D63\u2091\u1da0)\u2074 \u00D7 joint factor", `joint factor = ${n(d.ct.exc, 2)} for ${d.ct.name.split(",")[0]}`, `${n(d.vaPerKg, 2)} VA/kg`, REFS.K, "grade, flux density, joint type"),
    row("No-load current", "I\u2080", "I\u2080% = VA/kg \u00D7 W\u1da0\u2091 / (S\u00D710\u00B3) \u00D7 100", `= ${n(d.vaPerKg, 2)} \u00D7 ${n(d.wCore, 1)} / ${p.kva}000 \u00D7 100`, `${n(d.i0pct)} %`, REFS.K, "exciting VA, core weight"),
    row("Conductor weight", "W\u1D04\u1d64", "W = 3 N L\u2098\u209C a \u03C1\u2098", `LV: 3\u00D7${d.nLV}\u00D7${n(d.lmtLV, 3)}\u00D7${n(d.aLVreq)}\u00D710\u207B\u2076\u00D7${d.cLV.dens}`, `${n(d.wLV, 1)} + ${n(d.wHV, 1)} kg`, REFS.S, "turns, mean turn, area, density"),
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

  if (bom) {
    sec("10. Materials and cost build-up", "Works costing practice \u00B7 rates are yours to set", [
      row("Fluid volume", "V\u2092", d.dry ? "not applicable" : "V = tank volume \u2212 active part volume, \u00D7 fittings factor", d.dry ? "n/a" : `tank ${n((d.tankL * d.tankW * d.tankH) / 1e9, 3)} m\u00B3`, d.dry ? "n/a" : `${n(d.fluidLitres, 0)} L`, REFS.B, "tank size, active part"),
      row("Raw material", "n/a", "\u03A3 (quantity \u00D7 rate) over segments A, B, C", "see the costing tab", inr(bom.material), "Your rates", "weights, rates"),
      row("Factory cost", "n/a", "material + conversion + scrap", `= ${inr(bom.material)} + ${inr(bom.labourCost)} + ${inr(bom.scrap)}`, inr(bom.factory), "Your rates", "material, labour"),
      row("Ex-works price", "n/a", "factory + overhead + freight + margin", `= ${inr(bom.factory)} + ${inr(bom.overhead)} + ${inr(bom.freight)} + ${inr(bom.margin)}`, inr(bom.exFactory), "Your rates", "factory cost, percentages"),
      row("Cost of losses over life", "n/a", "(P\u2080 + k\u00B2P\u1D04) \u00D7 8760 \u00D7 years \u00D7 tariff / 1000", `= (${n(d.noLoad, 0)} + ${n(p.loadFactor)}\u00B2\u00D7${n(d.loadLoss, 0)}) \u00D7 8760 \u00D7 ${p.years} \u00D7 ${n(p.tariff)}/1000`, inr(bom.energy.total), "Evaluation practice", "losses, tariff, load factor"),
    ]);
  }
  return S;
}


function stepWidths(n, d) {
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
    const w = 2 * R * Math.cos(a[i]);
    const h = R * Math.sin(a[i]);
    const t = i === 0 ? 2 * h : h - prevH;      // centre pocket is full depth, others are per side
    rows.push({ w, t, halfH: h, perSide: i > 0 });
    total += w * (i === 0 ? 2 * h : 2 * (h - prevH));
    prevH = h;
  }
  return { rows, util: total / (Math.PI * R * R), area: total };
}

function stampingSchedule(d, steps) {
  const thk = d.grade.thk || 0.27;
  const Hw = d.Hw, C = d.cc;
  let wt = 0, sheets = 0;
  const rows = steps.rows.map((s, i) => {
    const stack = i === 0 ? s.t : 2 * s.t;
    const nSheets = Math.max(2, Math.round(stack / thk));
    const limbLong = Hw + 2 * s.w, limbShort = Hw;
    const yokeLong = 2 * C + s.w, yokeShort = 2 * C - s.w;
    const aLimb = (((limbLong + limbShort) / 2) * s.w) / 1e6;
    const aYoke = (((yokeLong + yokeShort) / 2) * s.w) / 1e6;
    const mass = (3 * aLimb + 2 * aYoke) * (stack / 1000) * 7650;
    wt += mass; sheets += nSheets * 5;
    return { i: i + 1, w: s.w, stack, nSheets, limbLong, limbShort, yokeLong, yokeShort, mass };
  });
  return { rows, totalMass: wt, totalSheets: sheets, thk };
}

function finLayout(d) {
  if (d.dry || d.finAreaReq <= 0) return { n: 0, depth: 0, height: 0, perSide: 0 };
  const depth = d.p.tankType === "fin" ? Math.min(400, Math.max(150, Math.round((d.tankH * 0.22) / 10) * 10)) : 320;
  const height = Math.max(200, d.tankH - 240);
  const per = (2 * height * depth) / 1e6;
  const n = Math.max(4, Math.ceil(d.finAreaReq / per));
  return { n, depth, height, perSide: Math.ceil(n / 2), per };
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
    r(6, "Core Manufacturing Drawing", "done", "Drawing 6 with the cutting schedule",
      "Clamp bolt positions are indicative, not from your clamping standard"),
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
    r(12, "Complete Bill of Materials", "part", "Costing tab, fully editable",
      "Item codes, supplier names, part numbers and per-line GST are not held. Add them or import your item master"),
    r(13, "Material Requirement Planning", "need", "n/a",
      "Requires stock on hand, supplier master, lead times and open purchase orders. None of this exists in the platform"),
    r(14, "Manufacturing Process Sheet", "need", "n/a", "Requires your routing, standard times and work-centre list"),
    r(15, "Production Routing Sheet", "need", "n/a", "Requires machine list, operator allocation and standard times"),
    r(16, "Cost Estimation Report", "done", "Costing tab with the full build-up to selling price"),
    r(17, "Cost Comparison Report", "done", "Compare and quote tab"),
    r(18, "Supplier Comparison Report", "need", "n/a", "Requires a supplier master with rates, lead time, quality rating and freight"),
    r(19, "Quality Inspection Report", "need", "n/a", "Requires your quality assurance plan and inspection stages"),
    r(20, "Routine Test Report", "part", "Predicted values below",
      "Design values are generated as the expected result. Measured values must come from the test floor"),
    r(21, "Type Test Report", "need", "n/a", "Requires results from a test laboratory. Temperature rise, impulse and short-circuit results cannot be predicted as certificates"),
    r(22, "FAT Report", "need", "n/a", "Requires witnessed test results and customer sign-off"),
    r(23, "Packing List", "part", "Total mass and overall dimensions are known",
      "Packaging scheme, case sizes and accessory crating are not modelled"),
    r(24, "Name Plate", "done", "Name plate drawing below"),
    r(25, "Dispatch Documents", "need", "n/a", "Requires commercial data: invoice terms, warranty text, transport booking"),
    r(26, "Revision Report", "need", "n/a", "Requires stored revisions. This build holds one live design in memory and does not persist history"),
    r(27, "Compliance Report", "part", "Compliance block on the design sheet",
      "Losses, impedance, temperature rise and ratio error are checked. A clause-by-clause report needs the licensed standard text"),
    r(28, "PDF Generation", "part", "PDF report button on the drawings tab",
      "Bookmarks, clickable index, QR code, digital signature and watermark need a server-side PDF pipeline"),
  ];
}

function routineTestSchedule(d) {
  const p = d.p;
  return [
    { t: "Voltage ratio at all taps", ref: "IEC 60076-1", exp: `${f3((d.nHV / d.nLV))} turns ratio, error ${f3(d.ratioErr)} %`, lim: "\u00B10.5 % of declared" },
    { t: "Vector group and polarity", ref: "IEC 60076-1", exp: p.vector, lim: "As declared" },
    { t: "Winding resistance HV", ref: "IEC 60076-1", exp: `${f3(d.rHV)} \u03A9 per phase at ${d.refT} \u00B0C`, lim: "Record, correct to reference temperature" },
    { t: "Winding resistance LV", ref: "IEC 60076-1", exp: `${d.rLV.toExponential(3)} \u03A9 per phase at ${d.refT} \u00B0C`, lim: "Record" },
    { t: "No-load loss and current at rated voltage", ref: "IEC 60076-1", exp: `${f0(d.noLoad)} W, ${f2(d.i0pct)} %`, lim: `${f0(d.sch.nll)} W guaranteed, +${d.std.lossTolPart} % on test` },
    { t: "Load loss and impedance at principal tap", ref: "IEC 60076-1", exp: `${f0(d.loadLoss)} W, ${f2(d.pctZ)} %`, lim: `${f0(d.sch.ll)} W guaranteed, impedance \u00B1${p.zTol} %` },
    { t: "Separate source AC withstand, HV", ref: "IEC 60076-3", exp: `${p.acHV} kV for 60 s`, lim: "No breakdown" },
    { t: "Separate source AC withstand, LV", ref: "IEC 60076-3", exp: `${p.acLV} kV for 60 s`, lim: "No breakdown" },
    { t: "Induced overvoltage withstand", ref: "IEC 60076-3", exp: "Twice rated voltage, duration per clause", lim: "No breakdown" },
    { t: "Insulation resistance", ref: "Works practice", exp: "Record HV-E, LV-E, HV-LV", lim: "Record" },
    { t: "Oil dielectric strength", ref: "IEC 60296", exp: d.dry ? "Not applicable" : "Sample before and after filling", lim: d.dry ? "n/a" : "60 kV minimum" },
  ];
}



/* ------------------------------------------------------------------
   Public API
   ------------------------------------------------------------------ */

export {
  CONDUCTORS, CORE_GRADES, CORE_TYPES, STEP_UTIL, UM_LEVELS, FLUIDS, DRY_TYPES,
  INS_CLASS, STANDARDS, APPS, EFF_LEVELS, ESSENTIALS, DEFAULT_RATES, UM_STEPS,
  lossSchedule, clearancesFrom, umFor, zSuggest, gradeSuggest, fluxSuggest,
  stepsSuggest, densitySuggest, aspectSuggest,
  deriveSpec, designTransformer, buildBOM, ownershipCost, searchDesigns,
  impacts, calcSheet, stepWidths, stampingSchedule, finLayout,
  documentRegister, routineTestSchedule, DOC_STATUS, REFS,
  inr, lakhs, bushMul, condRate, rkCond, fluxRange, bushHeight, parseVectorGroup,
};

export function computeDesign(core, over = {}, rates = DEFAULT_RATES, extras = []) {
  const spec = deriveSpec(core, over);
  const fitted = fitToSchedule(spec.S, over);
  const p = { ...spec.S, ...fitted };
  const design = designTransformer(p);
  const bom = buildBOM(design, rates, extras);
  return { spec, params: p, fitted, design, bom, engineVersion: ENGINE_VERSION };
}

export function fitToSchedule(S, over = {}) {
  if (!S.autoFit) return {};
  const lockF = over.flux !== undefined;
  const lockD = over.deltaLV !== undefined || over.deltaHV !== undefined;
  if (lockF && lockD) return {};
  const bMax = CORE_GRADES[S.coreGrade].bMax - 0.02;
  const bMin = S.coreGrade === "amor" ? 1.20 : 1.42;
  const cl = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  let flux = S.flux, dLV = S.deltaLV, dHV = S.deltaHV;
  for (let i = 0; i < 10; i++) {
    const t = designTransformer({ ...S, flux, deltaLV: dLV, deltaHV: dHV });
    if (!lockF && t.noLoad > 0) {
      flux = cl(flux * Math.pow(Math.pow((0.96 * t.sch.nll) / t.noLoad, 1 / 0.9), 0.55), bMin, bMax);
    }
    if (!lockD && t.loadLoss > 0) {
      const k = Math.pow((0.96 * t.sch.ll) / t.loadLoss, 0.6);
      dLV = cl(dLV * k, 0.7, CONDUCTORS[S.condLV].dMax);
      dHV = cl(dHV * k, 0.7, CONDUCTORS[S.condHV].dMax);
    }
  }
  const r2 = (x) => Math.round(x * 100) / 100;
  const o = {};
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
