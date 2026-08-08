import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

simulate_additions = """    const windowHeight = Math.round(hvAxial + (hvVoltage > 11000 ? 50 : 30));
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

    return {"""

content = content.replace("    return {", simulate_additions)

sim_ret_old = """      turnsDistribution, spacerDistribution, totalHvTurnsDisplay, totalSpacerThickness,
      tapPositions, turnsPerStep, validationWarnings, tapStepsList
    };"""
sim_ret_new = """      turnsDistribution, spacerDistribution, totalHvTurnsDisplay, totalSpacerThickness,
      tapPositions, turnsPerStep, validationWarnings, tapStepsList,
      tankDimensions: { length: tankLength, width: tankWidth, height: tankHeight, weight: tankWeight },
      oilQuantity,
      totalWeight: totalWeightCalc,
      windowHeight,
      limbCenter,
      tempRise,
      tempGradient,
      thermalTimeConstant
    };"""
content = content.replace(sim_ret_old, sim_ret_new)


calc_dest_old = """    hvId, hvCondThick, hvCondWidth, hvLayers, hvTpl, hvAxial, hvOd,
    coreSteps, plateA, plateB, plateC, noLoadLosses, loadLosses, impedance, calcEff
  } = finalRes;"""
calc_dest_new = """    hvId, hvCondThick, hvCondWidth, hvLayers, hvTpl, hvAxial, hvOd,
    coreSteps, plateA, plateB, plateC, noLoadLosses, loadLosses, impedance, calcEff,
    tankDimensions, oilQuantity, totalWeight, windowHeight, limbCenter, tempRise, tempGradient, thermalTimeConstant
  } = finalRes;"""
content = content.replace(calc_dest_old, calc_dest_new)

calc_ret_old = """    totalCoreCost,
    totalConductorCost,
    totalMaterialCost,
    sellingPrice,
    suggestedStrategy,
    budgetAnalysis,
    bom,
    complianceNote
  };"""
calc_ret_new = """    turnsDistribution: finalRes.turnsDistribution,
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
  };"""
content = content.replace(calc_ret_old, calc_ret_new)

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
