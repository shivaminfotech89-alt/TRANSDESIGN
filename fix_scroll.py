import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("flex-col lg:flex-row overflow-hidden", "flex-col lg:flex-row lg:overflow-hidden")
content = content.replace("overflow-y-auto print:hidden shadow", "lg:overflow-y-auto print:hidden shadow")
content = content.replace("overflow-y-auto bg-slate-50", "lg:overflow-y-auto bg-slate-50")
# The issue is min-h-screen makes the container screen height, and the main element takes flex-1. 
# On mobile, the main element is flex-col, so it expands vertically, but wait... if main is overflow-hidden, it limits the total height to the screen height. So changing to lg:overflow-hidden will let it expand on mobile.

with open('src/App.tsx', 'w') as f:
    f.write(content)

