import re

with open('src/types.ts', 'r') as f:
    content = f.read()

outputs_ext = """  // Tank and Thermal Metrics
  tankDimensions?: { length: number; width: number; height: number; weight: number };
  oilQuantity?: number;
  totalWeight?: number;
  windowHeight?: number;
  limbCenter?: number;
  tempRise?: number;
  tempGradient?: number;
  thermalTimeConstant?: number;
"""

content = content.replace("  // 7. BOM & Costing", outputs_ext + "  // 7. BOM & Costing")

with open('src/types.ts', 'w') as f:
    f.write(content)
