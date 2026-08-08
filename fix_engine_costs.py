with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

content = content.replace("  const totalCoreCost = coreWeight * (inputs.coreCostPerKg || 0);", "  const totalCoreCost = coreWeight * (inputs.coreCostPerKg || 0);")
content = content.replace("  const sellingPrice = totalMaterialCost / (1 - (inputs.marginPercentage || 0) / 100);", "  const sellingPrice = totalMaterialCost / (1 - (inputs.marginPercentage || 0) / 100);")
