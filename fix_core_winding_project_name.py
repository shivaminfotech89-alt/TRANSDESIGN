import re

with open('src/components/CorePartsDesignTab.tsx', 'r') as f:
    content = f.read()

# Add project name to core tab
core_header_new = """      {/* Document Title */}
      <div className="text-center font-bold text-lg mb-2 uppercase underline">
        {inputs.projectName || 'Untitled Design'} - Core Parts Design
      </div>
      {/* Header matching the PDF */}
      <div className="flex justify-between items-center border-2 border-black p-2 font-bold text-sm mb-6 uppercase">"""

content = content.replace("      {/* Header matching the PDF */}\n      <div className=\"flex justify-between items-center border-2 border-black p-2 font-bold text-sm mb-6 uppercase\">", core_header_new)

with open('src/components/CorePartsDesignTab.tsx', 'w') as f:
    f.write(content)


with open('src/components/WindingDesignTab.tsx', 'r') as f:
    content = f.read()

# Add project name to winding tab
winding_header_new = """      {/* Document Title */}
      <div className="text-center font-bold text-lg mb-2 uppercase underline">
        {inputs.projectName || 'Untitled Design'} - Winding Design Details
      </div>
      {/* Top Header Row */}
      <div className="flex justify-between border-2 border-black p-2 font-bold text-sm mb-4">"""

content = content.replace("      {/* Top Header Row */}\n      <div className=\"flex justify-between border-2 border-black p-2 font-bold text-sm mb-4\">", winding_header_new)

with open('src/components/WindingDesignTab.tsx', 'w') as f:
    f.write(content)
