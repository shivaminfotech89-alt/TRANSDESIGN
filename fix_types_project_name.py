import re

with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace("export interface TransformerInputs {", "export interface TransformerInputs {\n  projectName?: string;")

with open('src/types.ts', 'w') as f:
    f.write(content)
