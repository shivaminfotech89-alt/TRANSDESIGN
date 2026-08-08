with open('src/components/WindingDesignTab.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="flex"><span className="w-24">L.T Amp</span> <span>=</span> <span className="ml-2 text-right flex-1">## Amps</span></div>',
    '<div className="flex"><span className="w-24">L.T Amp</span> <span>=</span> <span className="ml-2 text-right flex-1">{outputs.lvPhaseCurrent.toFixed(0)} Amps</span></div>'
)

content = content.replace(
    '<div className="flex"><span className="w-24">H.T Amp</span> <span>=</span> <span className="ml-2 text-right flex-1">66 Amps</span></div>',
    '<div className="flex"><span className="w-24">H.T Amp</span> <span>=</span> <span className="ml-2 text-right flex-1">{outputs.hvPhaseCurrent.toFixed(0)} Amps</span></div>'
)

content = content.replace(
    '<div className="px-2 py-1 border-r-4 border-black w-16 text-center">##</div>',
    '<div className="px-2 py-1 border-r-4 border-black w-16 text-center">{Math.round(outputs.copperWeight * 0.55)}</div>'
)

with open('src/components/WindingDesignTab.tsx', 'w') as f:
    f.write(content)

