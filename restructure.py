import re

with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

# I want to insert the closing div of overview before DETAILED WINDING DESIGN RESULTS
# and then open winding tab

winding_marker = "{/* DETAILED WINDING DESIGN RESULTS */}"
core_model_marker = "{/* 3D CORE MODEL */}"
stepped_chart_marker = "{/* 3. STEPPED CORE CHART */}"
end_stepped_marker = "Total Weight of Core ="

parts = content.split(winding_marker)

part1 = parts[0]
part2 = parts[1].split(core_model_marker)

winding_content = part2[0]
part3 = part2[1].split(stepped_chart_marker)

core_model_content = part3[0]

# now we have to drop the stepped chart completely because we replace it.
# find where the stepped chart ends: it ends at `<aside className="lg:col-span-4 border-l border-[#27272A] `
part4 = content.split('<aside className="lg:col-span-4 border-l border-[#27272A] ')
aside_content = '<aside className="lg:col-span-4 border-l border-[#27272A] ' + part4[1]

# Reassemble:
# 1. part1 (contains start of overview)
# 2. core_model_content (belongs to overview)
# 3. close overview tab: </div>
# 4. open winding tab: <div className={`${activeTab === 'winding' ? 'block' : 'hidden'} print:block space-y-6`}>
# 5. winding_marker + winding_content
# 6. close winding tab: </div>
# 7. open core tab: <div className={`${activeTab === 'core' ? 'block' : 'hidden'} print:block space-y-6`}>
# 8. <CorePartsDesignTab inputs={inputs} outputs={outputs} />
# 9. close core tab: </div>
# 10. aside_content (Wait, aside is OUTSIDE the reportRef div?)

# Let's check where the closing tags of reportRef div are.
