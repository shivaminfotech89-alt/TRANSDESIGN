import React from 'react';
import { APPS, STANDARDS } from '@/packages/engine';
import { BoltHead } from '../RatingPlate';

interface NamePlateProps {
  design: any;
  params: any;
  project: any;
  docNo?: string;
}

/**
 * A field that must never be fabricated: shown as-entered, or flagged
 * pending with the missing item named, per CLAUDE.md invariant 5. Uses raw
 * hex, not the sheet-tuned amber/alert theme colours, because this sits on
 * the dark plate background like RatingPlate.tsx does.
 */
function Field({ label, value, pendingNote }: { label: string; value: string | number | undefined | null; pendingNote?: string }) {
  const isBlank = value === undefined || value === null || value === '';
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.22em] font-display text-plateEtch">{label}</div>
      {isBlank ? (
        <div className="text-[12px] font-mono" style={{ color: '#E3A08C' }}>
          Pending{pendingNote ? ` -- ${pendingNote}` : ''}
        </div>
      ) : (
        <div className="text-[13px] font-mono text-plateTx">{value}</div>
      )}
    </div>
  );
}

export function NamePlate({ design, params, project, docNo }: NamePlateProps) {
  const app = APPS[params.application]?.name || params.application;
  const std = STANDARDS[params.standard]?.name || params.standard;

  const totalMass = design.wCore + design.wLV + design.wHV + design.wIns
    + design.wFrame + design.wTank + design.wFin + design.wEnclosure
    + design.fluidLitres * design.fluid.dens;

  const tapLabel = params.tapType === 'none'
    ? 'None'
    : `${params.tapType === 'oltc' ? 'OLTC' : 'OCTC'} +${params.tapPlus}/-${params.tapMinus}%`;

  const rise = design.dry ? design.windRise : design.oilRise;

  const hvVolts = params.dualHV ? `${params.hv / 1000} / ${params.hv2 / 1000} kV` : `${params.hv / 1000} kV`;
  const lvVolts = params.dualLV ? `${params.lv} / ${params.lv2} V` : `${params.lv} V`;

  const ratingCells: [string, string][] = [
    ['Rated Power', `${params.kva} kVA`],
    ['Phases', '3'],
    ['Frequency', `${params.freq} Hz`],
    ['HV Voltage', hvVolts],
    ['LV Voltage', lvVolts],
    ['HV Line Current', `${design.iLineHV.toFixed(1)} A`],
    ['LV Line Current', `${design.iLineLV.toFixed(1)} A`],
    ['Vector Group', params.vector],
    ['Impedance', `${design.pctZ.toFixed(2)} %`],
    ['No-Load Loss', `${Math.round(design.noLoad)} W`],
    ['Load Loss', `${Math.round(design.loadLoss)} W`],
    ['Temperature Rise', `${rise.toFixed(1)} K`],
    ['HV Insulation Level', `${params.bilHV} kVp LI / ${params.acHV} kV AC`],
    ['LV Insulation Level', `${params.bilLV} kVp LI / ${params.acLV} kV AC`],
    ['Tappings', tapLabel],
    ['Cooling', params.cooling],
    ['Total Mass', `${Math.round(totalMass)} kg`],
    [design.dry ? 'Insulation Medium' : 'Oil Quantity', design.dry ? 'Dry type, no oil' : `${Math.round(design.fluidLitres)} L, ${design.fluid.name}`],
    ['Standard', std],
  ];

  return (
    <div
      className="relative rounded-[2px] p-4 bg-plate max-w-2xl"
      style={{ boxShadow: 'inset 0 0 0 1px #33454E, inset 0 0 0 5px #1B2A32, inset 0 0 0 6px #2A3B44' }}
    >
      <BoltHead corner="tl" />
      <BoltHead corner="tr" />
      <BoltHead corner="bl" />
      <BoltHead corner="br" />

      <div className="px-4 pt-1">
        <div className="text-[10px] uppercase tracking-[0.34em] font-display text-plateEtch">
          {app} Transformer &middot; {std}
        </div>
        <div className="text-[20px] font-display uppercase mt-1" style={{ color: '#E8B887' }}>
          {params.kva} kVA &middot; {params.hv / 1000} kV to {params.lv} V
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-3 px-4 pt-4 pb-2">
        <Field label="Manufacturer" value={project?.maker} pendingNote="works name not set in the project" />
        <Field label="Serial No" value={project?.serial} pendingNote="serial number not assigned" />
        <Field label="Customer" value={project?.customer} pendingNote="customer name not set in the project" />
        <Field label="Year of Manufacture" value={project?.year} />
        <Field label="Document No" value={docNo} />
        <Field label="Revision" value={project?.revision !== undefined ? String(project.revision).padStart(2, '0') : undefined} />
      </div>

      <div className="h-px my-2 mx-4" style={{ background: '#33454E' }} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-3 px-4 pt-2 pb-1">
        {ratingCells.map(([label, value]) => (
          <Field key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}
