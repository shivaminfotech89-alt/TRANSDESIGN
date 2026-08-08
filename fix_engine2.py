fpath = 'src/lib/engine.ts'
with open(fpath, 'r') as f:
    content = f.read()

old_return = """    return {
      bm, currentDensity, sellingPrice, coreWeight, conductorWeight,
      totalCoreCost, totalConductorCost, totalMaterialCost,
      ai, ag, coreDia, hvPhaseVoltage, lvPhaseVoltage, hvPhaseCurrent, lvPhaseCurrent,
      hvArea, lvArea, hvTurns, lvTurns, hvWindingType, lvWindingType, ratio, hiloGap,
      lvId, lvCondThick, lvCondWidth, lvLayers, lvTpl, lvAxial, lvOd,
      hvId, hvCondThick, hvCondWidth, hvLayers, hvTpl, hvAxial, hvOd,
      coreSteps, plateA, plateB, plateC, noLoadLosses, loadLosses, impedance, calcEff,
      tankDimensions: { length: tankLength, width: tankWidth, height: tankHeight, weight: tankWeight },
      oilQuantity, totalWeight: totalWeightCalc, windowHeight, limbCenter, tempRise, tempGradient, thermalTimeConstant
    };"""

new_return = """    return {
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
    };"""

content = content.replace(old_return, new_return)

with open(fpath, 'w') as f:
    f.write(content)
