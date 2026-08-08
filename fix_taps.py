with open('src/components/WindingDesignTab.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="font-bold">Taps at :- 0 -- 258 (Break)</div>',
    '<div className="font-bold">Taps at :- 0 -- {Math.round(outputs.hvTurns * 0.41)} (Break)</div>'
)

content = content.replace(
    '<div className="font-bold">-- 328 -- 335 -- 342 -- 349 -- 356 -- 363 -- 370 -- 628 (Finish).</div>',
    '<div className="font-bold">-- 328 -- 335 -- 342 -- 349 -- 356 -- 363 -- 370 -- {outputs.hvTurns} (Finish).</div>'
)

with open('src/components/WindingDesignTab.tsx', 'w') as f:
    f.write(content)

