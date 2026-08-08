import re

with open('src/components/WindingDesignTab.tsx', 'r') as f:
    content = f.read()

# Replace any direct Math.round on outputs that could be NaN with a fallback
content = re.sub(r'\{Math\.round\((outputs\.[a-zA-Z0-9_]+)\s*\*\s*([0-9.]+)\)\}', r'{Math.round((\1 || 0) * \2)}', content)
content = re.sub(r'\{Math\.round\((outputs\.[a-zA-Z0-9_]+)\)\}', r'{Math.round(\1 || 0)}', content)

with open('src/components/WindingDesignTab.tsx', 'w') as f:
    f.write(content)
