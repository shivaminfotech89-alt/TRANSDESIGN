import re

with open('src/components/WindingDesignTab.tsx', 'r') as f:
    content = f.read()

# Replace the static turns and spacer distribution
old_block = """              <div className="border-4 border-black bg-white inline-block px-1 mb-1 underline">Turns Distribution :-</div>
              <div className="pl-6 font-bold space-y-1">
                <div className="flex"><span className="w-48">6 Discs @ 13 Turns each</span><span>= 78</span></div>
                <div className="flex"><span className="w-48">12 Discs @ 15 Turns each</span><span>= 180</span></div>
                <div className="flex"><span className="w-48">8 Discs @ 14 Turns (TZ)</span><span>= 112</span></div>
                <div className="flex"><span className="w-48">12 Discs @ 15 Turns each</span><span>= 180</span></div>
                <div className="flex"><span className="w-48">6 Discs @ 13 Turns each</span><span>= 78</span></div>
                <div className="flex border-4 border-black w-max px-1 bg-white mt-1">
                  <span className="w-32 underline">Total Turns =</span><span className="underline ml-4">{outputs.hvTurns}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-2 border-t-2 border-black pt-2">
              <div className="border-4 border-black bg-white inline-block px-1 mb-1 underline">Spacer Distribution :-</div>
              <div className="pl-6 font-bold space-y-1">
                <div className="flex"><span className="w-56">2 Gaps of 3.0 mm each.</span> <span>6</span></div>
                <div className="flex"><span className="w-56">16 Gaps of 1.5 mm each.</span> <span>24</span></div>
                <div className="flex"><span className="w-56">One Gap of 7.5 mm (Break)</span> <span>7.5</span></div>
                <div className="flex"><span className="w-56">7 Gaps of 4.5 mm each</span> <span>32</span></div>
                <div className="flex"><span className="w-56">15 Gaps of 1.5 mm each.</span> <span>23</span></div>
                <div className="flex"><span className="w-56">2 Gaps of 3.0 mm each.</span> <span>6</span></div>
                <div className="flex w-64 justify-end border-t-2 border-black pt-1">
                  <span className="border-4 border-black px-2 bg-white underline">98</span>
                </div>
              </div>"""

new_block = """              <div className="border-4 border-black bg-white inline-block px-1 mb-1 underline">Turns Distribution :-</div>
              <div className="pl-6 font-bold space-y-1">
                {outputs.turnsDistribution?.map((dist, i) => (
                  <div key={i} className="flex"><span className="w-48">{dist.label}</span><span>= {dist.total}</span></div>
                ))}
                <div className="flex border-4 border-black w-max px-1 bg-white mt-1">
                  <span className="w-32 underline">Total Turns =</span><span className="underline ml-4">{outputs.totalHvTurnsDisplay}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-2 border-t-2 border-black pt-2">
              <div className="border-4 border-black bg-white inline-block px-1 mb-1 underline">Spacer Distribution :-</div>
              <div className="pl-6 font-bold space-y-1">
                {outputs.spacerDistribution?.map((dist, i) => (
                  <div key={i} className="flex"><span className="w-56">{dist.label}</span> <span>{dist.total}</span></div>
                ))}
                <div className="flex w-64 justify-end border-t-2 border-black pt-1">
                  <span className="border-4 border-black px-2 bg-white underline">{outputs.totalSpacerThickness}</span>
                </div>
              </div>"""

content = content.replace(old_block, new_block)

with open('src/components/WindingDesignTab.tsx', 'w') as f:
    f.write(content)
