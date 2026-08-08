import glob

fpaths = glob.glob('src/components/reports/templates/*.tsx')
for fpath in fpaths:
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
