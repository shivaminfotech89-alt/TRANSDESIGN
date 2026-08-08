import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('className="min-h-screen bg-slate-50', 'className="min-h-screen lg:h-screen bg-slate-50')

with open('src/App.tsx', 'w') as f:
    f.write(content)
