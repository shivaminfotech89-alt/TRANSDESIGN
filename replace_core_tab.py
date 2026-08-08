with open('src/components/ResultsDisplay.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "{/* 3. STEPPED CORE CHART */}" in line:
        start_idx = i
    if "Total Weight of Core =" in line:
        # found the end part, we need to go down to the closing divs
        # It's at 334, so let's just find the next </div></div></div>
        end_idx = i + 5

if start_idx != -1 and end_idx != -1:
    # also we need to close the overview tab div
    replacement = [
        "          </div>\n",
        "          {/* CORE TAB */}\n",
        "          <div className={`${activeTab === 'core' ? 'block' : 'hidden'} print:block`}>\n",
        "            <CorePartsDesignTab inputs={inputs} outputs={outputs} />\n",
        "          </div>\n",
        "          {/* WINDING TAB */}\n",
        "          <div className={`${activeTab === 'winding' ? 'block' : 'hidden'} print:block`}>\n",
        "             {/* The winding section was earlier, but I'll move it here if it wasn't already */} \n"
    ]
    
    # Wait, the DETAILED WINDING DESIGN RESULTS is before the 3D core model!
