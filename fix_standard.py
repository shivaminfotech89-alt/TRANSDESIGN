import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

standard_setup = """  const standard = inputs.referenceStandard || 'IEC 60076';
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

  // Adjust BM based on standard
  if (standard === 'EcoDesign' && initialBm > 1.45) initialBm = 1.45;
  if (standard === 'IS 1180' && initialBm > 1.55) initialBm = 1.55;
"""

content = content.replace("  let bestResult: any = null;", standard_setup + "\n  let bestResult: any = null;")
content = content.replace("const impedance = Math.min(Math.max((loadLosses / (kVA * 10)) + 3.5, 4.0), 6.5);", "const impedance = targetImpedance + (loadLosses / (kVA * 15)) - 0.2;")
content = content.replace("const strategyMessage = strategy === 'Lowest Cost'", "const strategyMessage = `[${standard}] ` + (strategy === 'Lowest Cost'")
content = content.replace("suggestedStrategy,\n    budgetAnalysis,\n    bom\n  };", "suggestedStrategy,\n    budgetAnalysis,\n    bom,\n    complianceNote\n  };")

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
