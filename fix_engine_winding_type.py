import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

content = content.replace("hvVoltage > 11000 ? 'Disc Winding'", "hvVoltage >= 11000 ? 'Disc Winding'")

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
