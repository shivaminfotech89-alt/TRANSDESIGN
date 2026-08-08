fpath = 'src/components/reports/templates/InputSheetReport.tsx'
with open(fpath, 'r') as f:
    content = f.read()

content = content.replace('guaranteedNoLoadLoss', 'targetNoLoadLoss')
content = content.replace('guaranteedLoadLoss', 'targetLoadLoss')
content = content.replace('impedancePercent', 'targetImpedance')

with open(fpath, 'w') as f:
    f.write(content)
