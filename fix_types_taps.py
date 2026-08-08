import re

with open('src/types.ts', 'r') as f:
    content = f.read()

# Add to inputs
inputs_block = """  tapChanger?: TapChanger;
  tapRangeAbove?: number;
  tapRangeBelow?: number;
  tapStepVariation?: number;"""
content = content.replace("  tapChanger?: TapChanger;", inputs_block)

# Add to outputs
outputs_block = """  // Winding Detailed Dimensions
  tapPositions?: number;
  turnsPerStep?: number;
  validationWarnings?: string[];"""
content = content.replace("  // Winding Detailed Dimensions", outputs_block)

with open('src/types.ts', 'w') as f:
    f.write(content)
