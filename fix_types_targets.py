import re

with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace("  phases: number;", "  phases: number;\n  targetImpedance?: number;\n  targetLoadLoss?: number;\n  targetNoLoadLoss?: number;")

with open('src/types.ts', 'w') as f:
    f.write(content)
