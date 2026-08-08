import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

# Add calculation in simulate
dist_calc = """
    // Distribution Calculations
    const turnsDistribution: {label: string, turns: number, total: number}[] = [];
    const spacerDistribution: {label: string, thickness: number, total: number}[] = [];
    let totalHvTurnsDisplay = hvTurns;
    let totalSpacerThickness = 0;

    if (hvWindingType === 'Disc Winding') {
      // Very simplified disc winding logic
      const totalDiscs = Math.max(10, Math.ceil(hvTurns / 14));
      const evenDiscs = totalDiscs % 2 !== 0 ? totalDiscs + 1 : totalDiscs;
      const midDiscs = Math.floor(evenDiscs * 0.2);
      const topDiscs = Math.floor((evenDiscs - midDiscs) / 2);
      const botDiscs = evenDiscs - midDiscs - topDiscs;
      
      const turnsPerDisc = Math.floor(hvTurns / evenDiscs);
      const remTurns = hvTurns - (turnsPerDisc * evenDiscs);
      
      const topTurns = turnsPerDisc;
      const midTurns = turnsPerDisc + Math.floor(remTurns / midDiscs);
      const botTurns = turnsPerDisc;
      
      turnsDistribution.push({ label: `${topDiscs} Discs @ ${topTurns} Turns each`, turns: topTurns, total: topDiscs * topTurns });
      turnsDistribution.push({ label: `${midDiscs} Discs @ ${midTurns} Turns (TZ)`, turns: midTurns, total: midDiscs * midTurns });
      turnsDistribution.push({ label: `${botDiscs} Discs @ ${botTurns} Turns each`, turns: botTurns, total: botDiscs * botTurns });
      
      totalHvTurnsDisplay = (topDiscs * topTurns) + (midDiscs * midTurns) + (botDiscs * botTurns);
      
      // Spacers
      spacerDistribution.push({ label: `2 Gaps of 3.0 mm each`, thickness: 3, total: 6 });
      spacerDistribution.push({ label: `${topDiscs-2} Gaps of 1.5 mm each`, thickness: 1.5, total: Math.round((topDiscs-2)*1.5) });
      spacerDistribution.push({ label: `${midDiscs} Gaps of 3.0 mm each (TZ)`, thickness: 3, total: midDiscs*3 });
      spacerDistribution.push({ label: `${botDiscs-2} Gaps of 1.5 mm each`, thickness: 1.5, total: Math.round((botDiscs-2)*1.5) });
      spacerDistribution.push({ label: `2 Gaps of 3.0 mm each`, thickness: 3, total: 6 });
      
      totalSpacerThickness = 6 + Math.round((topDiscs-2)*1.5) + (midDiscs*3) + Math.round((botDiscs-2)*1.5) + 6;
    } else {
      // Layer Winding
      const layers = hvLayers;
      const tpl = hvTpl;
      turnsDistribution.push({ label: `${layers} Layers @ ${tpl} Turns each`, turns: tpl, total: layers * tpl });
      totalHvTurnsDisplay = layers * tpl;
      
      spacerDistribution.push({ label: `${layers-1} Layer Insulations (1.0mm)`, thickness: 1.0, total: (layers-1) * 1.0 });
      totalSpacerThickness = (layers-1) * 1.0;
    }
"""

replacement = dist_calc + "\n    return {"
content = content.replace("    return {", replacement, 1) # Only replace the return inside simulate

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
