import re

with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace("  strategyMessage: string;", "  strategyMessage: string;\n  complianceNote: string;")

with open('src/types.ts', 'w') as f:
    f.write(content)
