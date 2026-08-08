import re

with open('src/index.css', 'r') as f:
    content = f.read()

content = content.replace("  overflow: hidden;", "")

with open('src/index.css', 'w') as f:
    f.write(content)
