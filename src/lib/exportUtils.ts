import * as XLSX from 'xlsx';
import { TransformerInputs, TransformerOutputs } from '../types';

export function exportToExcel(inputs: TransformerInputs, outputs: TransformerOutputs) {
  const wb = XLSX.utils.book_new();
  
  // 1. GTP Sheet
  const gtpData = [
    ['Guaranteed Technical Parameters (GTP)'],
    [],
    ['Parameter', 'Unit', 'Value'],
    ['Project Name', '-', inputs.projectName || 'Untitled'],
    ['Capacity', 'kVA', inputs.kVA],
    ['HV Voltage', 'V', inputs.hvVoltage],
    ['LV Voltage', 'V', inputs.lvVoltage],
    ['Phases', '-', inputs.phases],
    ['Frequency', 'Hz', inputs.frequency || 50],
    ['Vector Group', '-', inputs.vectorGroup || 'Dyn11'],
    ['Cooling', '-', inputs.cooling],
    ['Core Material', '-', inputs.coreMaterial],
    ['Conductor', '-', inputs.conductor],
    ['Reference Standard', '-', inputs.referenceStandard || 'IS 1180'],
    ['No-Load Loss (Target)', 'W', inputs.targetNoLoadLoss || '-'],
    ['No-Load Loss (Calculated)', 'W', outputs.noLoadLosses],
    ['Load Loss (Target)', 'W', inputs.targetLoadLoss || '-'],
    ['Load Loss (Calculated)', 'W', outputs.loadLosses],
    ['Impedance (Target)', '%', inputs.targetImpedance || '-'],
    ['Impedance (Calculated)', '%', outputs.impedance.toFixed(3)],
    ['Efficiency @ 50%', '%', outputs.efficiency.load50.toFixed(2)],
    ['Efficiency @ 100%', '%', outputs.efficiency.load100.toFixed(2)],
    ['Temperature Rise (Oil/Winding)', '°C', `${outputs.tempRise} / ${outputs.tempRise ? outputs.tempRise + 5 : 55}`],
    ['Thermal Time Constant', 'Hours', outputs.thermalTimeConstant],
    ['Overall Weight (Approx)', 'kg', outputs.totalWeight],
    ['Oil Quantity (Approx)', 'L', outputs.oilQuantity],
  ];
  
  const wsGtp = XLSX.utils.aoa_to_sheet(gtpData);
  // Styling
  wsGtp['!cols'] = [{wch: 35}, {wch: 10}, {wch: 25}];
  XLSX.utils.book_append_sheet(wb, wsGtp, 'GTP');

  // 2. Core Lamination Data
  const coreData = [
    ['Core Lamination Data'],
    [],
    ['Core Diameter', `${outputs.coreDia.toFixed(1)} mm`],
    ['Net Iron Area (Ai)', `${(outputs.ai * 10000).toFixed(2)} cm²`],
    ['Gross Iron Area (Ag)', `${(outputs.ag * 10000).toFixed(2)} cm²`],
    ['Window Height', `${outputs.windowHeight} mm`],
    ['Limb Center', `${outputs.limbCenter} mm`],
    ['Total Core Weight', `${outputs.coreWeight.toFixed(1)} kg`],
    [],
    ['Step No', 'Width (mm)', 'Thickness (mm)', 'Weight (kg)']
  ];
  
  outputs.coreSteps.forEach(step => {
    coreData.push([step.step.toString(), step.width.toString(), step.thickness.toString(), step.weight.toFixed(2)]);
  });
  
  const wsCore = XLSX.utils.aoa_to_sheet(coreData);
  wsCore['!cols'] = [{wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}];
  XLSX.utils.book_append_sheet(wb, wsCore, 'Core Lamination');

  // 3. HT Winding Data
  const windingData = [
    ['Production-Ready HT Winding Sheet'],
    [],
    ['Conductor', inputs.conductor],
    ['Total Turns', outputs.hvTurns.toString()],
    ['Current Density', `${outputs.currentDensity.toFixed(3)} A/mm²`],
    ['Conductor Bare Size', `${outputs.hvCondThick} x ${outputs.hvCondWidth} mm`],
    ['Layers / Discs', outputs.hvLayers.toString()],
    ['Turns per Layer / Disc', outputs.hvTpl.toString()],
    ['Axial Height', `${outputs.hvAxial} mm`],
    ['Inner Diameter (ID)', `${outputs.hvId} mm`],
    ['Outer Diameter (OD)', `${outputs.hvOd} mm`],
    ['Copper/Al Weight', `${outputs.copperWeight.toFixed(1)} kg`],
    []
  ];
  
  if (outputs.tapPositions && outputs.tapStepsList) {
    windingData.push(['Tap Details']);
    windingData.push(['Tap Changer Type', inputs.tapChanger || 'OCTC']);
    windingData.push(['Tap Range', `+${inputs.tapRangeAbove}% to -${inputs.tapRangeBelow}%`]);
    windingData.push(['Turns Per Step', outputs.turnsPerStep?.toString() || '-']);
    windingData.push(['Tap Turn Positions', outputs.tapStepsList.join(' -- ')]);
    windingData.push([]);
  }

  if (outputs.turnsDistribution && outputs.turnsDistribution.length > 0) {
    windingData.push(['Turns Distribution']);
    outputs.turnsDistribution.forEach(dist => {
      windingData.push([dist.label, dist.total.toString()]);
    });
    windingData.push([]);
  }

  if (outputs.spacerDistribution && outputs.spacerDistribution.length > 0) {
    windingData.push(['Spacer Distribution']);
    outputs.spacerDistribution.forEach(dist => {
      windingData.push([dist.label, dist.total.toString()]);
    });
  }

  const wsWinding = XLSX.utils.aoa_to_sheet(windingData);
  wsWinding['!cols'] = [{wch: 35}, {wch: 25}];
  XLSX.utils.book_append_sheet(wb, wsWinding, 'HT Winding');

  // Generate File
  XLSX.writeFile(wb, `Transformer_Design_${inputs.projectName || 'Untitled'}.xlsx`);
}
