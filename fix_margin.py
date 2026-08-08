with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "const sellingPrice = totalMaterialCost / (1 - (inputs.marginPercentage || 0) / 100);",
    "const margin = Math.min(inputs.marginPercentage || 0, 99);\n  const sellingPrice = totalMaterialCost / (1 - margin / 100);"
)

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
