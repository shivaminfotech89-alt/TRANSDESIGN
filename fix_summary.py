fpath = 'src/components/reports/templates/SummaryReport.tsx'
with open(fpath, 'r') as f:
    content = f.read()

content = content.replace('guaranteedNoLoadLoss', 'targetNoLoadLoss')
content = content.replace('guaranteedLoadLoss', 'targetLoadLoss')
content = content.replace('impedancePercent', 'targetImpedance')
content = content.replace('calculatedNoLoadLoss', 'noLoadLosses')
content = content.replace('calculatedLoadLoss', 'loadLosses')
content = content.replace('calculatedImpedance', 'impedance')

with open(fpath, 'w') as f:
    f.write(content)

fpath = 'src/components/reports/templates/RoutineTestReport.tsx'
with open(fpath, 'r') as f:
    content = f.read()

content = content.replace('guaranteedNoLoadLoss', 'targetNoLoadLoss')
content = content.replace('guaranteedLoadLoss', 'targetLoadLoss')
content = content.replace('impedancePercent', 'targetImpedance')
content = content.replace('calculatedNoLoadLoss', 'noLoadLosses')
content = content.replace('calculatedLoadLoss', 'loadLosses')
content = content.replace('calculatedImpedance', 'impedance')

with open(fpath, 'w') as f:
    f.write(content)
