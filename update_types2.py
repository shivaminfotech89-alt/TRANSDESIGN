import re

with open('src/types.ts', 'r') as f:
    content = f.read()

types_to_add = """
export type StandardType = 'IEC 60076' | 'IEEE C57' | 'IS 1180' | 'EcoDesign';
export type InsulationClass = 'A' | 'B' | 'F' | 'H';
"""

inputs_to_add = """
  referenceStandard?: StandardType;
  insulationClass?: InsulationClass;
  maxFluxDensity?: number;
  maxCurrentDensityHv?: number;
  maxCurrentDensityLv?: number;
"""

content = content.replace("export type CoolingMethod", types_to_add + "\nexport type CoolingMethod")
content = content.replace("  tankType?: TankType;", "  tankType?: TankType;\n" + inputs_to_add)

with open('src/types.ts', 'w') as f:
    f.write(content)
