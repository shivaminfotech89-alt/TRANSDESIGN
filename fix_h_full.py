import re
with open('src/components/ResultsDisplay.tsx', 'r') as f:
    content = f.read()

content = content.replace('className="flex flex-col h-full lg:flex-row gap-8"', 'className="flex flex-col lg:flex-row gap-8"')

with open('src/components/ResultsDisplay.tsx', 'w') as f:
    f.write(content)
