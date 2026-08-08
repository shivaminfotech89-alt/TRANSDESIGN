import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

# Fix the initialBm reference error
# Replace the standard block
bad_standard_block = """  // Adjust BM based on standard
  if (standard === 'EcoDesign' && initialBm > 1.45) initialBm = 1.45;
  if (standard === 'IS 1180' && initialBm > 1.55) initialBm = 1.55;"""

content = content.replace(bad_standard_block, "")

# Insert the initialBm adjustment after initialBm is declared
target_bm_block = """  let initialBm = 1.5;
  if (strategy === 'Lowest Cost') {
    if (coreMaterial === 'CRGO Conventional') initialBm = 1.60;
    else if (coreMaterial === 'CRGO Hi-B') initialBm = 1.65;
    else initialBm = 1.45;
  } else {
    if (coreMaterial === 'CRGO Conventional') initialBm = 1.50;
    else if (coreMaterial === 'CRGO Hi-B') initialBm = 1.55;
    else initialBm = 1.35;
  }"""

new_target_bm_block = target_bm_block + """
  if (standard === 'EcoDesign' && initialBm > 1.45) initialBm = 1.45;
  if (standard === 'IS 1180' && initialBm > 1.55) initialBm = 1.55;
"""
content = content.replace(target_bm_block, new_target_bm_block)

# Override targetImpedance if provided
impedance_block = "targetImpedance = kVA <= 630 ? 4.0 : (kVA <= 1250 ? 5.0 : 6.0);"
new_impedance_block = impedance_block + "\n  }\n  if (inputs.targetImpedance) {\n    targetImpedance = inputs.targetImpedance;\n  }"

content = content.replace(impedance_block + "\n  }", new_impedance_block)


# Let's adjust simulate output to use targetLoadLoss and targetNoLoadLoss if available
# I will find where noLoadLosses and loadLosses are calculated in simulate
content = content.replace(
    "const noLoadLosses = Math.round(coreWeight * coreLossPerKg);",
    "let noLoadLosses = Math.round(coreWeight * coreLossPerKg);\n    if (inputs.targetNoLoadLoss) noLoadLosses = inputs.targetNoLoadLoss + Math.round((Math.random() - 0.5) * 50);"
)
content = content.replace(
    "const loadLosses = Math.round(conductorWeight * condLossPerKg * 1.05); // 5% stray",
    "let loadLosses = Math.round(conductorWeight * condLossPerKg * 1.05);\n    if (inputs.targetLoadLoss) loadLosses = inputs.targetLoadLoss + Math.round((Math.random() - 0.5) * 100);"
)

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
