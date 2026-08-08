import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

# Make hiloGap use hvVoltage ranges similar to suggestions
hilo_block = "const hiloGap = Math.round(15 + (hvVoltage / 1000));"
new_hilo_block = """let hiloGap = 11;
    if (hvVoltage >= 33000) hiloGap = 18;
    else if (hvVoltage >= 22000) hiloGap = 15;
    else if (hvVoltage >= 11000) hiloGap = 11;
    else hiloGap = 8;"""

content = content.replace(hilo_block, new_hilo_block)

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
