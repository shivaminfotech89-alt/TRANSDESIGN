import { TransformerInputs, TransformerOutputs, CoreStep } from '../types';

export function calculateTransformer(inputs: TransformerInputs): TransformerOutputs {
  const kVA = Math.max(inputs.kVA || 1, 1);
  const hvVoltage = Math.max(inputs.hvVoltage || 1, 1);
  const lvVoltage = Math.max(inputs.lvVoltage || 1, 1);
  const phases = inputs.phases || 3;
  const frequency = Math.max(inputs.frequency || 50, 1);
  
  const {
    cooling,
    coreMaterial,
    conductor,
    strategy,
  } = inputs;

  const sPhase = kVA / (phases === 3 ? 3 : 1);
  
  // Voltage per turn constant (K)
  let kFactor = 0;
  if (cooling === 'Dry Type') kFactor = 0.45;
  else if (cooling === 'Oil Immersed') kFactor = 0.50;
  
  const et = kFactor * Math.sqrt(sPhase);

  const margin = Math.min(inputs.marginPercentage || 0, 99);

  const standard = inputs.referenceStandard || 'IEC 60076';
  let complianceNote = '';
  let targetImpedance = 4.0;
  
  if (standard === 'IS 1180') {
    complianceNote = 'IS 1180 Tier 1/2/3 energy efficiency limits apply. Optimized for Indian utility specifications.';
    targetImpedance = kVA <= 630 ? 4.0 : 5.0;
  } else if (standard === 'EcoDesign') {
    complianceNote = 'European EcoDesign Tier 2 (2021) limits apply. Focus on ultra-low no-load losses (Amorphous/Hi-B recommended).';
    targetImpedance = kVA <= 630 ? 4.0 : 6.0;
  } else if (standard === 'IEEE C57') {
    complianceNote = 'IEEE C57.12.00 applicable. BIL and clearance requirements differ. Temp limits typically 65°C rise.';
    targetImpedance = kVA <= 500 ? 4.5 : 5.75;
  } else {
    complianceNote = 'IEC 60076 standard applied. General loss and impedance tolerances used.';
    targetImpedance = kVA <= 630 ? 4.0 : (kVA <= 1250 ? 5.0 : 6.0);
  }
  if (inputs.targetImpedance) {
    targetImpedance = inputs.targetImpedance;
  }



  let bestResult: any = null;
  let minVariance = Infinity;

  // Limits
  let maxBm = 1.75;
  let maxCd = conductor === 'Copper' ? 4.5 : 2.5;

  let initialBm = 1.5;
  if (strategy === 'Lowest Cost') {
    if (coreMaterial === 'CRGO Conventional') initialBm = 1.60;
    else if (coreMaterial === 'CRGO Hi-B') initialBm = 1.65;
    else initialBm = 1.45;
  } else {
    if (coreMaterial === 'CRGO Conventional') initialBm = 1.50;
    else if (coreMaterial === 'CRGO Hi-B') initialBm = 1.55;
    else initialBm = 1.35;
  }
  if (standard === 'EcoDesign' && initialBm > 1.45) initialBm = 1.45;
  if (standard === 'IS 1180' && initialBm > 1.55) initialBm = 1.55;


  let initialCd = 2.5;
  if (strategy === 'Lowest Cost') {
    initialCd = conductor === 'Copper' ? 3.2 : 1.8;
  } else {
    initialCd = conductor === 'Copper' ? 2.5 : 1.4;
  }

  function simulate(bm: number, currentDensity: number) {
    const ai = et / (4.44 * frequency * bm);
    const stackingFactor = 0.95;
    const ag = ai / stackingFactor;
    const ks = 0.90;
    const coreDiaMeters = Math.sqrt((4 * ag) / (Math.PI * ks));
    const coreDia = coreDiaMeters * 1000;
  
    const hvPhaseVoltage = phases === 3 ? hvVoltage / Math.sqrt(3) : hvVoltage;
    const lvPhaseVoltage = phases === 3 ? lvVoltage / Math.sqrt(3) : lvVoltage;
  
    const hvPhaseCurrent = (kVA * 1000) / (phases * hvPhaseVoltage);
    const lvPhaseCurrent = (kVA * 1000) / (phases * lvPhaseVoltage);
  
    const hvArea = hvPhaseCurrent / currentDensity;
    const lvArea = lvPhaseCurrent / currentDensity;
    
    const hvTurns = Math.round(hvPhaseVoltage / et);
    
    let tapPositions = 0;
    let turnsPerStep = 0;
    let tapStepsList: number[] = [];
    if (inputs.tapChanger && inputs.tapChanger !== 'None') {
      const step = inputs.tapStepVariation || 2.5;
      const above = inputs.tapRangeAbove || 5.0;
      const below = inputs.tapRangeBelow || 5.0;
      tapPositions = Math.round(above / step) + Math.round(below / step) + 1;
      turnsPerStep = Number((hvTurns * (step / 100)).toFixed(2));
      
      const nominalTapTurns = hvTurns - Math.round(hvTurns * (above / 100));
      for (let i = 0; i < tapPositions; i++) {
        tapStepsList.push(Math.round(nominalTapTurns + (i * turnsPerStep)));
      }
    }
    const lvTurns = Math.round(lvPhaseVoltage / et);
  
    const hvWindingType = hvVoltage >= 11000 ? 'Disc Winding' : 'Layer/Helical Winding';
    const lvWindingType = lvArea > 500 ? 'Foil Winding' : 'Spiral Winding';
    
    const ratio = Number((hvVoltage / lvVoltage).toFixed(2));
    let hiloGap = 11;
    if (hvVoltage >= 33000) hiloGap = 18;
    else if (hvVoltage >= 22000) hiloGap = 15;
    else if (hvVoltage >= 11000) hiloGap = 11;
    else hiloGap = 8;
    
    const lvId = Math.round(coreDia + 10);
    const lvCondThick = Math.max(Math.round(Math.sqrt(lvArea / 3) * 10) / 10, 0.5);
    const lvCondWidth = Math.round((lvArea / lvCondThick) * 10) / 10;
    const lvLayers = Math.max(2, Math.round(lvTurns / 20));
    const lvTpl = Math.ceil(lvTurns / lvLayers);
    const lvAxial = Math.round(lvTpl * lvCondWidth * 1.15);
    const lvOd = Math.round(lvId + 2 * lvLayers * lvCondThick * 1.25);
  
    const hvId = Math.round(lvOd + 2 * hiloGap);
    const hvCondThick = Math.max(Math.round(Math.sqrt(hvArea / 3) * 10) / 10, 0.5);
    const hvCondWidth = Math.round((hvArea / hvCondThick) * 10) / 10;
    const hvLayers = Math.max(4, Math.ceil(Math.sqrt(hvTurns)));
    const hvTpl = Math.ceil(hvTurns / hvLayers);
    const hvAxial = Math.round(hvTpl * hvCondWidth * 1.3);
    const hvOd = Math.round(hvId + 2 * hvLayers * hvCondThick * 1.3);
  
    const coreSteps: CoreStep[] = [];
    const stepRatios = [0.95, 0.85, 0.73, 0.60, 0.45, 0.35, 0.22];
    const totalApproxWeight = (kVA * 12); 
    
    const plateA: any[] = [];
    const plateB: any[] = [];
    const plateC: any[] = [];
    
    stepRatios.forEach((ratio, index) => {
      const width = Math.round(ratio * coreDia);
      const prevWidth = index === 0 ? coreDia : stepRatios[index-1] * coreDia;
      const thickness = Math.round((prevWidth - width) / 2 + 5); 
      const stack = Math.max(thickness, 8);
      const w = Math.round((totalApproxWeight / 7) * (1 - index * 0.1));
      
      coreSteps.push({ step: index + 1, width, thickness: stack, weight: w });
      plateA.push({ sNo: index + 1, a: Math.round(width * 3.5), stepWidth: width, weight: +(w * 0.4).toFixed(1) });
      plateB.push({ sNo: index + 1, a: Math.round(width * 2.8), stepWidth: width, weight: +(w * 0.2).toFixed(1) });
      plateC.push({ sNo: index + 1, a: Math.round(width * 3.2), stepWidth: width, weight: +(w * 0.4).toFixed(1) });
    });
  
    const coreWeight = Math.round(coreSteps.reduce((acc, step) => acc + step.weight, 0));
    const cuDensity = conductor === 'Copper' ? 8890 : 2700;
    const meanLength = Math.PI * (coreDiaMeters + 0.1); 
    const volHv = 3 * (hvArea * 1e-6) * hvTurns * meanLength;
    const volLv = 3 * (lvArea * 1e-6) * lvTurns * meanLength;
    const conductorWeight = Math.round((volHv + volLv) * cuDensity);
  
    const totalCoreCost = coreWeight * (inputs.coreCostPerKg || 0);
    const totalConductorCost = conductorWeight * (inputs.conductorCostPerKg || 0);
    
    // Quick approx for loop
    const tankWeightApprox = kVA * 1.5;
    const oilVolumeApprox = kVA * 2.1;
    const insulationCost = (totalCoreCost + totalConductorCost) * 0.05;
    const tcCost = (inputs.tapChanger === 'OLTC' ? 350000 : (inputs.tapChanger === 'OCTC' ? 25000 : 0));
    const oilCost = cooling !== 'Dry Type' ? oilVolumeApprox * (inputs.oilCostPerLitre || 95) : 0;
    const tankCost = tankWeightApprox * (inputs.steelCostPerKg || 75);

    const totalMaterialCost = totalCoreCost + totalConductorCost + insulationCost + tcCost + oilCost + tankCost;
    const sellingPrice = totalMaterialCost / (1 - margin / 100);


    let specificCoreLoss = 1.1;
    if (coreMaterial === 'CRGO Hi-B') specificCoreLoss = 0.85;
    if (coreMaterial === 'Amorphous') specificCoreLoss = 0.25;
    specificCoreLoss = specificCoreLoss * Math.pow(bm / 1.5, 2);
    
    const noLoadLosses = inputs.targetNoLoadLoss ? inputs.targetNoLoadLoss : Math.round(coreWeight * specificCoreLoss);
    
    const rho = conductor === 'Copper' ? 0.021 : 0.035;
    const rHv = rho * (hvTurns * meanLength) / hvArea;
    const rLv = rho * (lvTurns * meanLength) / lvArea;
    
    const baseLoadLosses = 3 * (Math.pow(hvPhaseCurrent, 2) * rHv + Math.pow(lvPhaseCurrent, 2) * rLv);
    const loadLosses = inputs.targetLoadLoss ? inputs.targetLoadLoss : Math.round(baseLoadLosses * 1.15); 
  
    const impedance = targetImpedance + (loadLosses / (kVA * 15)) - 0.2; 
  
    const calcEff = (loadPercent: number) => {
      const pOut = kVA * 1000 * loadPercent;
      const pLoss = noLoadLosses + (loadLosses * Math.pow(loadPercent, 2));
      return Number(((pOut / (pOut + pLoss)) * 100).toFixed(2));
    };
    
    const validationWarnings: string[] = [];
    if (currentDensity > maxCd) validationWarnings.push(`Current Density (${currentDensity.toFixed(2)}) exceeds max allowed (${maxCd.toFixed(2)})`);
    if (bm > maxBm) validationWarnings.push(`Flux Density (${bm.toFixed(2)}) exceeds max allowed (${maxBm.toFixed(2)})`);
    if (Math.abs(impedance - targetImpedance) > targetImpedance * 0.1) validationWarnings.push(`Impedance (${impedance.toFixed(2)}%) is out of +/-10% tolerance from target (${targetImpedance.toFixed(2)}%)`);



    // Distribution Calculations
    const turnsDistribution: {label: string, turns: number, total: number}[] = [];
    const spacerDistribution: {label: string, thickness: number, total: number}[] = [];
    let totalHvTurnsDisplay = hvTurns;
    let totalSpacerThickness = 0;

    if (hvWindingType === 'Disc Winding') {
      // Very simplified disc winding logic
      const totalDiscs = Math.max(10, Math.ceil(hvTurns / 14));
      const evenDiscs = totalDiscs % 2 !== 0 ? totalDiscs + 1 : totalDiscs;
      const midDiscs = Math.floor(evenDiscs * 0.2);
      const topDiscs = Math.floor((evenDiscs - midDiscs) / 2);
      const botDiscs = evenDiscs - midDiscs - topDiscs;
      
      const turnsPerDisc = Math.floor(hvTurns / evenDiscs);
      const remTurns = hvTurns - (turnsPerDisc * evenDiscs);
      
      const topTurns = turnsPerDisc;
      const midTurns = turnsPerDisc + Math.floor(remTurns / midDiscs);
      const botTurns = turnsPerDisc;
      
      turnsDistribution.push({ label: `${topDiscs} Discs @ ${topTurns} Turns each`, turns: topTurns, total: topDiscs * topTurns });
      turnsDistribution.push({ label: `${midDiscs} Discs @ ${midTurns} Turns (TZ)`, turns: midTurns, total: midDiscs * midTurns });
      turnsDistribution.push({ label: `${botDiscs} Discs @ ${botTurns} Turns each`, turns: botTurns, total: botDiscs * botTurns });
      
      totalHvTurnsDisplay = (topDiscs * topTurns) + (midDiscs * midTurns) + (botDiscs * botTurns);
      
      // Spacers
      spacerDistribution.push({ label: `2 Gaps of 3.0 mm each`, thickness: 3, total: 6 });
      spacerDistribution.push({ label: `${topDiscs-2} Gaps of 1.5 mm each`, thickness: 1.5, total: Math.round((topDiscs-2)*1.5) });
      spacerDistribution.push({ label: `${midDiscs} Gaps of 3.0 mm each (TZ)`, thickness: 3, total: midDiscs*3 });
      spacerDistribution.push({ label: `${botDiscs-2} Gaps of 1.5 mm each`, thickness: 1.5, total: Math.round((botDiscs-2)*1.5) });
      spacerDistribution.push({ label: `2 Gaps of 3.0 mm each`, thickness: 3, total: 6 });
      
      totalSpacerThickness = 6 + Math.round((topDiscs-2)*1.5) + (midDiscs*3) + Math.round((botDiscs-2)*1.5) + 6;
    } else {
      // Layer Winding
      const layers = hvLayers;
      const tpl = hvTpl;
      turnsDistribution.push({ label: `${layers} Layers @ ${tpl} Turns each`, turns: tpl, total: layers * tpl });
      totalHvTurnsDisplay = layers * tpl;
      
      spacerDistribution.push({ label: `${layers-1} Layer Insulations (1.0mm)`, thickness: 1.0, total: (layers-1) * 1.0 });
      totalSpacerThickness = (layers-1) * 1.0;
    }

    const windowHeight = Math.round(hvAxial + (hvVoltage > 11000 ? 50 : 30));
    const clearancePhaseToPhase = 15;
    const limbCenter = Math.round(coreDia + (hvOd - hvId) + clearancePhaseToPhase);

    // Thermal & Tank calculations
    const totalLosses = loadLosses + noLoadLosses;
    
    // Tank sizes (rough approximations)
    const tankWidth = Math.round((limbCenter * (phases - 1)) + coreDia + 100); 
    const tankLength = Math.round(coreDia + 150);
    const tankHeight = Math.round(windowHeight + 300); 
    const tankWeight = Math.round(tankWidth * tankLength * tankHeight * 0.00000003); // heuristic
    
    const oilQuantity = Math.round(kVA * 2.1); // Liters
    const totalWeightCalc = coreWeight + conductorWeight + tankWeight + (oilQuantity * 0.89); 
    
    // Thermal parameters
    const tempRise = inputs.tempRise || 50; 
    const tempGradient = 12.5; 
    const thermalTimeConstant = Math.round((totalWeightCalc * 0.4) / (totalLosses * 0.005)) || 2.5; 

    return {
      bm, currentDensity, sellingPrice, coreWeight, conductorWeight,
      totalCoreCost, totalConductorCost, totalMaterialCost,
      ai, ag, coreDia, hvPhaseVoltage, lvPhaseVoltage, hvPhaseCurrent, lvPhaseCurrent,
      hvArea, lvArea, hvTurns, lvTurns, hvWindingType, lvWindingType, ratio, hiloGap,
      lvId, lvCondThick, lvCondWidth, lvLayers, lvTpl, lvAxial, lvOd,
      hvId, hvCondThick, hvCondWidth, hvLayers, hvTpl, hvAxial, hvOd,
      coreSteps, plateA, plateB, plateC, noLoadLosses, loadLosses, impedance, calcEff,
      tankDimensions: { length: tankLength, width: tankWidth, height: tankHeight, weight: tankWeight },
      oilQuantity, totalWeight: totalWeightCalc, windowHeight, limbCenter, tempRise, tempGradient, thermalTimeConstant,
      turnsDistribution, spacerDistribution, totalHvTurnsDisplay, totalSpacerThickness,
      tapPositions, turnsPerStep, validationWarnings, tapStepsList
    };
  }

  let finalRes = simulate(initialBm, initialCd);

  let wasModified = false;

  if (inputs.targetBudget && inputs.targetBudget > 0 && finalRes.sellingPrice > inputs.targetBudget) {
    // Budget optimization loop
    wasModified = true;
    let currBm = initialBm;
    let currCd = initialCd;
    
    // Try increasing Cd and Bm incrementally
    while (finalRes.sellingPrice > inputs.targetBudget && (currBm < maxBm || currCd < maxCd)) {
      if (currCd < maxCd) currCd = Math.min(currCd + 0.1, maxCd);
      if (currBm < maxBm) currBm = Math.min(currBm + 0.02, maxBm);
      
      const newRes = simulate(currBm, currCd);
      if (newRes.sellingPrice < finalRes.sellingPrice) {
        finalRes = newRes;
      } else {
        break; // If cost stops decreasing
      }
    }
  }

  const {
    bm, currentDensity, sellingPrice, coreWeight, conductorWeight,
    totalCoreCost, totalConductorCost, totalMaterialCost,
    ai, ag, coreDia, hvPhaseVoltage, lvPhaseVoltage, hvPhaseCurrent, lvPhaseCurrent,
    hvArea, lvArea, hvTurns, lvTurns, hvWindingType, lvWindingType, ratio, hiloGap,
    lvId, lvCondThick, lvCondWidth, lvLayers, lvTpl, lvAxial, lvOd,
    hvId, hvCondThick, hvCondWidth, hvLayers, hvTpl, hvAxial, hvOd,
    coreSteps, plateA, plateB, plateC, noLoadLosses, loadLosses, impedance, calcEff,
    tankDimensions, oilQuantity, totalWeight, windowHeight, limbCenter, tempRise, tempGradient, thermalTimeConstant
  } = finalRes;


  const oilCostPerLitre = inputs.oilCostPerLitre || 95;
  const steelCostPerKg = inputs.steelCostPerKg || 75;
  const tankWeightApprox = kVA * 1.5;
  const oilVolumeApprox = kVA * 2.1;
  const insulationCost = (totalCoreCost + totalConductorCost) * 0.05;

  const bom: any[] = [
    {
      id: 'BOM-001',
      category: 'Core',
      description: `CRGO Steel (${coreMaterial})`,
      quantity: coreWeight,
      unit: 'kg',
      unitRate: inputs.coreCostPerKg || 0,
      totalCost: totalCoreCost
    },
    {
      id: 'BOM-002',
      category: 'Winding',
      description: `${conductor} Conductor`,
      quantity: conductorWeight,
      unit: 'kg',
      unitRate: inputs.conductorCostPerKg || 0,
      totalCost: totalConductorCost
    },
    {
      id: 'BOM-003',
      category: 'Tank & Struct',
      description: `Mild Steel Tank (${inputs.tankType || 'Standard'})`,
      quantity: tankWeightApprox,
      unit: 'kg',
      unitRate: steelCostPerKg,
      totalCost: tankWeightApprox * steelCostPerKg
    },
    {
      id: 'BOM-004',
      category: 'Insulation',
      description: 'Kraft Paper, Pressboard & Insulation Kits',
      quantity: 1,
      unit: 'lot',
      unitRate: insulationCost,
      totalCost: insulationCost
    },
  ];
  
  if (cooling !== 'Dry Type') {
    bom.push({
      id: 'BOM-005',
      category: 'Oil',
      description: 'Transformer Oil (Mineral)',
      quantity: oilVolumeApprox,
      unit: 'Liters',
      unitRate: oilCostPerLitre,
      totalCost: oilVolumeApprox * oilCostPerLitre
    });
  }
  
  if (inputs.tapChanger && inputs.tapChanger !== 'None') {
    bom.push({
      id: 'BOM-006',
      category: 'Accessories',
      description: `${inputs.tapChanger} Mechanism & Switches`,
      quantity: 1,
      unit: 'set',
      unitRate: inputs.tapChanger === 'OLTC' ? 350000 : 25000,
      totalCost: inputs.tapChanger === 'OLTC' ? 350000 : 25000
    });
  }

  let budgetAnalysis = undefined;
  if (inputs.targetBudget && inputs.targetBudget > 0) {
    const isWithinBudget = sellingPrice <= inputs.targetBudget;
    const variance = sellingPrice - inputs.targetBudget;
    
    let pros: string[] = [];
    let cons: string[] = [];
    let suggestedMods: string[] = [];
    
    if (isWithinBudget) {
      pros = [
        wasModified ? "Design automatically optimized to meet customer budget!" : "Design meets the customer budget naturally.",
      ];
      cons = [
        wasModified ? "Increased load losses due to budget optimization." : "May not be the absolute lowest loss design."
      ];
      suggestedMods = [
        "Consider offering an upgraded 'High Efficiency' variant using Amorphous core at a slight premium."
      ];
    } else {
      pros = [
        "Lower material usage leads to a lighter, more compact transformer."
      ];
      cons = [
        "Even after optimization, target budget could not be reached with current materials.",
        "Maximum allowable current density and flux density reached."
      ];
      
      suggestedMods = [
        "Switch from Copper to Aluminum conductor (reduces cost significantly).",
        "Decrease target margin %.",
        "Use lower grade CRGO steel (Conventional instead of Hi-B)."
      ];
    }

    budgetAnalysis = {
      isWithinBudget,
      variance,
      pros,
      cons,
      suggestedMods
    };
  }

  let suggestedStrategy = "Lowest Cost";
  if (inputs.marginPercentage > 20) {
    suggestedStrategy = "High Efficiency (Generous Margin allows better materials)";
  } else if (inputs.coreCostPerKg > 300) {
    suggestedStrategy = "Lowest Cost (High core cost detected, optimize for less CRGO)";
  } else {
    suggestedStrategy = "Balanced (Standard Margin)";
  }

  const strategyMessage = `[${standard}] ` + (strategy === 'Lowest Cost'
    ? "Design optimized for minimal upfront capital cost. Note: This increases I²R load losses and core losses, leading to higher operating costs."
    : "Design optimized for high energy efficiency (EcoDesign / IS 1180 compliant). Increased upfront material cost offsets lifetime operating losses.");

  return {
    strategyMessage,
    sPhase,
    kFactor,
    et,
    bm,
    ai,
    ag,
    coreDia,
    hvPhaseVoltage,
    lvPhaseVoltage,
    hvPhaseCurrent,
    lvPhaseCurrent,
    hvTurns,
    lvTurns,
    currentDensity,
    hvArea,
    lvArea,
    hvWindingType,
    lvWindingType,
    hiloGap,
    lvId, lvOd, lvCondWidth, lvCondThick, lvLayers, lvTpl, lvAxial,
    hvId, hvOd, hvCondWidth, hvCondThick, hvLayers, hvTpl, hvAxial,
    ratio,
    coreSteps,
    plateA,
    plateB,
    plateC,
    noLoadLosses,
    loadLosses,
    impedance,
    copperWeight: conductorWeight,
    coreWeight,
    efficiency: {
      load25: calcEff(0.25),
      load50: calcEff(0.50),
      load75: calcEff(0.75),
      load100: calcEff(1.00),
    },
    turnsDistribution: finalRes.turnsDistribution,
    spacerDistribution: finalRes.spacerDistribution,
    totalHvTurnsDisplay: finalRes.totalHvTurnsDisplay,
    totalSpacerThickness: finalRes.totalSpacerThickness,
    tapPositions: finalRes.tapPositions,
    turnsPerStep: finalRes.turnsPerStep,
    validationWarnings: finalRes.validationWarnings,
    tapStepsList: finalRes.tapStepsList,
    tankDimensions,
    oilQuantity,
    totalWeight,
    windowHeight,
    limbCenter,
    tempRise,
    tempGradient,
    thermalTimeConstant,
    totalCoreCost,
    totalConductorCost,
    totalMaterialCost,
    sellingPrice,
    suggestedStrategy,
    budgetAnalysis,
    bom,
    complianceNote
  };
}
