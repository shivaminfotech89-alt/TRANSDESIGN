fpath = 'src/components/reports/templates/AccessoriesReport.tsx'
with open(fpath, 'r') as f:
    content = f.read()

content = content.replace('(For >500kVA)', '(For &gt;500kVA)')

with open(fpath, 'w') as f:
    f.write(content)
