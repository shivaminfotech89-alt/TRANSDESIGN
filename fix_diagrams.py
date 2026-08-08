with open('src/components/WindingDesignTab.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="bg-white px-1 relative -top-3 text-xs">505</div>',
    '<div className="bg-white px-1 relative -top-3 text-xs">{outputs.lvAxial}</div>'
)

content = content.replace(
    '<div className="bg-white py-1 text-xs relative z-10 pr-2">525</div>',
    '<div className="bg-white py-1 text-xs relative z-10 pr-2">{outputs.lvAxial + 20}</div>'
)

content = content.replace(
    '<span className="relative top-0 left-4 bg-white px-1">57</span>',
    '<span className="relative top-0 left-4 bg-white px-1">{Math.round(outputs.lvAxial * 0.11)}</span>'
)

with open('src/components/WindingDesignTab.tsx', 'w') as f:
    f.write(content)

