import os
import glob

# Fix CalcReport.tsx
fpath = 'src/components/reports/templates/CalcReport.tsx'
with open(fpath, 'r') as f:
    content = f.read()

# Make sure we add a calculation for resistance
content = content.replace('export function CalcReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {', 
'''export function CalcReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const hvRes = (outputs.loadLosses * 0.45) / (3 * Math.pow(outputs.hvPhaseCurrent, 2)) || 0;
  const lvRes = (outputs.loadLosses * 0.45) / (3 * Math.pow(outputs.lvPhaseCurrent, 2)) || 0;
''')

content = content.replace('outputs.voltsPerTurn?.toFixed', 'outputs.et?.toFixed')
content = content.replace('outputs.netCoreArea?.toFixed(2)', '(outputs.ai * 10000)?.toFixed(2)')
content = content.replace('outputs.grossCoreArea?.toFixed(2)', '(outputs.ag * 10000)?.toFixed(2)')
content = content.replace('outputs.coreDiameter?.toFixed', 'outputs.coreDia?.toFixed')
content = content.replace('outputs.lvConductorArea?.toFixed', 'outputs.lvArea?.toFixed')
content = content.replace('outputs.hvConductorArea?.toFixed', 'outputs.hvArea?.toFixed')
content = content.replace('outputs.lvResistance', 'lvRes')
content = content.replace('outputs.hvResistance', 'hvRes')
content = content.replace('outputs.calculatedNoLoadLoss?.toFixed', 'outputs.noLoadLosses?.toFixed')
content = content.replace('outputs.calculatedLoadLoss?.toFixed', 'outputs.loadLosses?.toFixed')
content = content.replace('outputs.calculatedImpedance?.toFixed', 'outputs.impedance?.toFixed')

with open(fpath, 'w') as f:
    f.write(content)

# Fix RoutineTestReport.tsx
fpath = 'src/components/reports/templates/RoutineTestReport.tsx'
with open(fpath, 'r') as f:
    content = f.read()

content = content.replace('export function RoutineTestReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {', 
'''export function RoutineTestReport({ inputs, outputs }: { inputs: TransformerInputs, outputs: TransformerOutputs }) {
  const hvRes = (outputs.loadLosses * 0.45) / (3 * Math.pow(outputs.hvPhaseCurrent, 2)) || 0;
  const lvRes = (outputs.loadLosses * 0.45) / (3 * Math.pow(outputs.lvPhaseCurrent, 2)) || 0;
''')

content = content.replace('outputs.hvResistance', 'hvRes')
content = content.replace('outputs.lvResistance', 'lvRes')
content = content.replace('outputs.calculatedNoLoadLoss?.toFixed', 'outputs.noLoadLosses?.toFixed')
content = content.replace('outputs.calculatedLoadLoss?.toFixed', 'outputs.loadLosses?.toFixed')
content = content.replace('outputs.calculatedImpedance?.toFixed', 'outputs.impedance?.toFixed')

with open(fpath, 'w') as f:
    f.write(content)

# Fix SummaryReport.tsx
fpath = 'src/components/reports/templates/SummaryReport.tsx'
with open(fpath, 'r') as f:
    content = f.read()

content = content.replace('outputs.calculatedNoLoadLoss?.toFixed', 'outputs.noLoadLosses?.toFixed')
content = content.replace('outputs.calculatedLoadLoss?.toFixed', 'outputs.loadLosses?.toFixed')
content = content.replace('outputs.calculatedImpedance?.toFixed', 'outputs.impedance?.toFixed')
content = content.replace('outputs.conductorWeight?.toFixed', 'outputs.copperWeight?.toFixed')
content = content.replace('outputs.conductorWeight)', 'outputs.copperWeight)')

with open(fpath, 'w') as f:
    f.write(content)

# Fix BOMReport.tsx
fpath = 'src/components/reports/templates/BOMReport.tsx'
with open(fpath, 'r') as f:
    content = f.read()

content = content.replace('outputs.conductorWeight', 'outputs.copperWeight')

with open(fpath, 'w') as f:
    f.write(content)

# Fix NamePlateReport.tsx
fpath = 'src/components/reports/templates/NamePlateReport.tsx'
with open(fpath, 'r') as f:
    content = f.read()

content = content.replace('outputs.conductorWeight', 'outputs.copperWeight')

with open(fpath, 'w') as f:
    f.write(content)
