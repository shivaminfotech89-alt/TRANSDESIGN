import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

defaults = """
    referenceStandard: 'IEC 60076',
    insulationClass: 'A',
    maxFluxDensity: 1.7,
    maxCurrentDensityHv: 3.0,
    maxCurrentDensityLv: 3.0,
"""

content = content.replace("    vectorGroup: 'Dyn11',", defaults + "\n    vectorGroup: 'Dyn11',")

with open('src/App.tsx', 'w') as f:
    f.write(content)
