import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

# Add tap calculations to simulate
# Where hvTurns is calculated:
#     const hvTurns = Math.round(hvPhaseVoltage / et);

tap_logic = """    const hvTurns = Math.round(hvPhaseVoltage / et);
    
    let tapPositions = 0;
    let turnsPerStep = 0;
    if (inputs.tapChanger && inputs.tapChanger !== 'None') {
      const step = inputs.tapStepVariation || 2.5;
      const above = inputs.tapRangeAbove || 5.0;
      const below = inputs.tapRangeBelow || 5.0;
      tapPositions = Math.round(above / step) + Math.round(below / step) + 1;
      turnsPerStep = Number((hvTurns * (step / 100)).toFixed(2));
    }"""
    
content = content.replace("    const hvTurns = Math.round(hvPhaseVoltage / et);", tap_logic)

# Add validation warnings
validation_logic = """    const calcEff = (loadPercent: number) => {
      const pOut = kVA * 1000 * loadPercent;
      const pLoss = noLoadLosses + (loadLosses * Math.pow(loadPercent, 2));
      return Number(((pOut / (pOut + pLoss)) * 100).toFixed(2));
    };
    
    const validationWarnings: string[] = [];
    if (currentDensity > maxCd) validationWarnings.push(`Current Density (${currentDensity.toFixed(2)}) exceeds max allowed (${maxCd.toFixed(2)})`);
    if (bm > maxBm) validationWarnings.push(`Flux Density (${bm.toFixed(2)}) exceeds max allowed (${maxBm.toFixed(2)})`);
    if (Math.abs(impedance - targetImpedance) > targetImpedance * 0.1) validationWarnings.push(`Impedance (${impedance.toFixed(2)}%) is out of +/-10% tolerance from target (${targetImpedance.toFixed(2)}%)`);
"""

content = content.replace("""    const calcEff = (loadPercent: number) => {
      const pOut = kVA * 1000 * loadPercent;
      const pLoss = noLoadLosses + (loadLosses * Math.pow(loadPercent, 2));
      return Number(((pOut / (pOut + pLoss)) * 100).toFixed(2));
    };""", validation_logic)

return_logic_old = """      turnsDistribution, spacerDistribution, totalHvTurnsDisplay, totalSpacerThickness
    };"""
return_logic_new = """      turnsDistribution, spacerDistribution, totalHvTurnsDisplay, totalSpacerThickness,
      tapPositions, turnsPerStep, validationWarnings
    };"""

content = content.replace(return_logic_old, return_logic_new)

# In the main calculateTransformer return
final_return_old = """    turnsDistribution: finalRes.turnsDistribution,
    spacerDistribution: finalRes.spacerDistribution,
    totalHvTurnsDisplay: finalRes.totalHvTurnsDisplay,
    totalSpacerThickness: finalRes.totalSpacerThickness,"""

final_return_new = """    turnsDistribution: finalRes.turnsDistribution,
    spacerDistribution: finalRes.spacerDistribution,
    totalHvTurnsDisplay: finalRes.totalHvTurnsDisplay,
    totalSpacerThickness: finalRes.totalSpacerThickness,
    tapPositions: finalRes.tapPositions,
    turnsPerStep: finalRes.turnsPerStep,
    validationWarnings: finalRes.validationWarnings,"""

content = content.replace(final_return_old, final_return_new)

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
