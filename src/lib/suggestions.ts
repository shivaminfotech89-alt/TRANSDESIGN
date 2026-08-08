export function getSuggestions(kVA: number, hvVoltage: number = 11000, conductor: string = 'Copper', standard: string = 'IS 1180') {
  let impBest = 4.0;
  let impRange = [3.5, 5.0];
  let impTol = "+/- 10%";
  
  if (standard === 'IS 1180') {
    if (kVA > 2500) { impBest = 6.25; impRange = [5.5, 7.0]; }
    else if (kVA > 630) { impBest = 5.0; impRange = [4.5, 6.0]; }
    else { impBest = 4.0; impRange = [3.5, 5.0]; }
  } else {
    if (kVA >= 2500) { impBest = 6.0; impRange = [5.0, 7.14]; }
    else if (kVA >= 1000) { impBest = 5.0; impRange = [4.5, 6.0]; }
    else if (kVA >= 630) { impBest = 4.5; impRange = [4.0, 5.0]; }
  }

  // Load losses
  let llMultiplier = 11.5;
  if (standard === 'IS 1180') {
    if (kVA <= 100) llMultiplier = 14.5;
    else if (kVA <= 630) llMultiplier = 12.0;
    else llMultiplier = 10.5;
  }
  const llBest = Math.round(kVA * llMultiplier);
  const llMin = Math.round(kVA * (llMultiplier * 0.75));
  const llMax = Math.round(kVA * (llMultiplier * 1.3));

  // No Load losses
  let nllMultiplier = 1.15;
  if (standard === 'IS 1180') {
    if (kVA <= 100) nllMultiplier = 2.0;
    else if (kVA <= 630) nllMultiplier = 1.3;
    else nllMultiplier = 1.0;
  }
  const nllBest = Math.round(kVA * nllMultiplier);
  const nllMin = Math.round(kVA * (nllMultiplier * 0.7));
  const nllMax = Math.round(kVA * (nllMultiplier * 1.5));

  // Current Density
  const cdBest = conductor === 'Copper' ? 3.0 : 1.6;
  const cdMin = conductor === 'Copper' ? 2.0 : 1.2;
  const cdMax = conductor === 'Copper' ? 4.5 : 2.5;

  // Flux Density
  const bmBest = 1.55;
  const bmMin = 1.3;
  const bmMax = 1.7;

  // Withstand Voltages
  let hvUm = 12, hvBIL = 75, hvAC = 28;
  if (hvVoltage >= 33000) { hvUm = 36; hvBIL = 170; hvAC = 70; }
  else if (hvVoltage >= 22000) { hvUm = 24; hvBIL = 125; hvAC = 50; }
  else if (hvVoltage >= 11000) { hvUm = 12; hvBIL = 75; hvAC = 28; }
  else { hvUm = 3.6; hvBIL = 40; hvAC = 10; }

  // Constants
  const kFactor = Number((0.45 * Math.sqrt(kVA / 3)).toFixed(2));
  const coreBuildingFactor = 1.15; // Typical for step-lap
  const windowAspect = 2.5;
  const hiloClearance = hvVoltage >= 33000 ? 18 : 11;

  return {
    impedance: { best: impBest, min: impRange[0], max: impRange[1], tolerance: impTol },
    loadLoss: { best: llBest, min: llMin, max: llMax },
    noLoadLoss: { best: nllBest, min: nllMin, max: nllMax },
    currentDensity: { best: cdBest, min: cdMin, max: cdMax },
    fluxDensity: { best: bmBest, min: bmMin, max: bmMax },
    electrical: { hvUm, hvBIL, hvAC, lvUm: 1.1, lvBIL: '-', lvAC: 3 },
    constants: { kFactor, coreBuildingFactor, windowAspect, hiloClearance, stepsInStack: 7 }
  };
}
