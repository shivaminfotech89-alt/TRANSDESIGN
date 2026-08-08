import re

with open('src/types.ts', 'r') as f:
    content = f.read()

# Add to TransformerOutputs
outputs_interface = """  hvAxial: number;
  
  turnsDistribution?: { label: string; turns: number; total: number }[];
  spacerDistribution?: { label: string; thickness: number; total: number }[];
  totalHvTurnsDisplay?: number;
  totalSpacerThickness?: number;
"""

content = content.replace("  hvAxial: number;\n", outputs_interface)

with open('src/types.ts', 'w') as f:
    f.write(content)
