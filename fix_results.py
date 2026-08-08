import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

content = content.replace('{Math.round(outputs.coreWeight + outputs.copperWeight)}', '{Math.round((outputs.coreWeight || 0) + (outputs.copperWeight || 0))}')

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
