fpath = 'src/components/reports/templates/BOMReport.tsx'
with open(fpath, 'r') as f:
    content = f.read()

content = content.replace('m.qty.toFixed(2)', 'm.qty?.toFixed(2) || "0.00"')

with open(fpath, 'w') as f:
    f.write(content)
