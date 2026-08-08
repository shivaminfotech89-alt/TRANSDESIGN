import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# Markers
m_winding = "{/* DETAILED WINDING DESIGN RESULTS */}"
m_core_model = "{/* 3D CORE MODEL */}"
m_stepped = "{/* 3. STEPPED CORE CHART */}"
m_aside = '<aside className="lg:col-span-4'

# Extract blocks
idx_winding = content.find(m_winding)
idx_core_model = content.find(m_core_model)
idx_stepped = content.find(m_stepped)
idx_aside = content.find(m_aside)

# Find the end of stepped core (it's up to m_aside minus some closing divs)
# Specifically, we know the div with ref={reportRef} is closed right before m_aside.
# We will just replace everything from idx_winding to idx_aside.

part1 = content[:idx_winding]  # This has the start of overview up to 2. WINDING STRUCTURE

core_model_content = content[idx_core_model:idx_stepped]

winding_content = content[idx_winding:idx_core_model]

# Now assemble
new_content = (
    part1 +
    core_model_content +
    "          </div>\n\n" + # Close overview tab
    "          {/* WINDING TAB */}\n" +
    "          <div className={`${activeTab === 'winding' ? 'block' : 'hidden'} print:block space-y-6`}>\n  " +
    "          " + winding_content +
    "          </div>\n\n" + # Close winding tab
    "          {/* CORE TAB */}\n" +
    "          <div className={`${activeTab === 'core' ? 'block' : 'hidden'} print:block space-y-6`}>\n" +
    "            <CorePartsDesignTab inputs={inputs} outputs={outputs} />\n" +
    "          </div>\n" +
    "        </div>\n\n" + # Close reportRef div
    "      </div>\n\n" +   # Close lg:col-span-8
    "      " + content[idx_aside:]
)

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(new_content)

