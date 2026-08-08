import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

# Add to simulate return
simulate_return_old = """      hvCondThick, hvCondWidth, hvLayers, hvTpl, hvAxial, hvOd,
      coreSteps, plateA, plateB, plateC, noLoadLosses, loadLosses, impedance, calcEff
    };"""

simulate_return_new = """      hvCondThick, hvCondWidth, hvLayers, hvTpl, hvAxial, hvOd,
      coreSteps, plateA, plateB, plateC, noLoadLosses, loadLosses, impedance, calcEff,
      turnsDistribution, spacerDistribution, totalHvTurnsDisplay, totalSpacerThickness
    };"""
content = content.replace(simulate_return_old, simulate_return_new)

# Add to calculateTransformer return
calc_return_old = """    hvCondThick: finalRes.hvCondThick,
    hvLayers: finalRes.hvLayers,
    hvTpl: finalRes.hvTpl,
    hvAxial: finalRes.hvAxial,"""

calc_return_new = """    hvCondThick: finalRes.hvCondThick,
    hvLayers: finalRes.hvLayers,
    hvTpl: finalRes.hvTpl,
    hvAxial: finalRes.hvAxial,
    turnsDistribution: finalRes.turnsDistribution,
    spacerDistribution: finalRes.spacerDistribution,
    totalHvTurnsDisplay: finalRes.totalHvTurnsDisplay,
    totalSpacerThickness: finalRes.totalSpacerThickness,"""
content = content.replace(calc_return_old, calc_return_new)

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
