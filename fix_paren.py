import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

content = content.replace('lifetime operating losses.";', 'lifetime operating losses.");')

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
