import React from 'react';
import { APPS, STANDARDS, inr } from '@/packages/engine';

interface RatingPlateProps {
  design: any;
  bom: any;
  params: any;
}

export function BoltHead({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const pos: Record<string, string> = {
    tl: 'top-2 left-2', tr: 'top-2 right-2', bl: 'bottom-2 left-2', br: 'bottom-2 right-2',
  };
  return (
    <div
      className={`absolute ${pos[corner]} w-[7px] h-[7px] rounded-full`}
      style={{ background: '#0E1920', boxShadow: '0 1px 0 #3D515B' }}
    />
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.22em] font-display text-plateEtch">{label}</div>
      <div className="text-[13px] font-mono text-plateTx">{value}</div>
    </div>
  );
}

export function RatingPlate({ design, bom, params }: RatingPlateProps) {
  const app = APPS[params.application]?.name || params.application;
  const std = STANDARDS[params.standard]?.name || params.standard;

  const totalMass = design.wCore + design.wLV + design.wHV + design.wIns
    + design.wFrame + design.wTank + design.wFin + design.wEnclosure
    + design.fluidLitres * design.fluid.dens;

  const tapLabel = params.tapType === 'none'
    ? 'None'
    : `${params.tapType === 'oltc' ? 'OLTC' : 'OCTC'} +${params.tapPlus}/-${params.tapMinus}%`;

  const rise = design.dry ? design.windRise : design.oilRise;

  const cells: [string, string][] = [
    ['Vector Group', params.vector],
    ['Impedance', `${design.pctZ.toFixed(2)} %`],
    ['No-Load Loss', `${Math.round(design.noLoad)} W`],
    ['Load Loss', `${Math.round(design.loadLoss)} W`],
    ['Efficiency', `${design.eff100.toFixed(2)} %`],
    ['Insulation Level', `${params.bilHV} kVp`],
    ['Cooling', params.cooling],
    ['HV / LV Current', `${design.iHV.toFixed(1)} / ${design.iLV.toFixed(1)} A`],
    ['Turns HV / LV', `${design.nHV} / ${design.nLV}`],
    ['Tappings', tapLabel],
    ['Temperature Rise', `${rise.toFixed(1)} K`],
    ['Total Mass', `${Math.round(totalMass)} kg`],
  ];

  return (
    <div
      className="relative rounded-[2px] p-4 bg-plate"
      style={{ boxShadow: 'inset 0 0 0 1px #33454E, inset 0 0 0 5px #1B2A32, inset 0 0 0 6px #2A3B44' }}
    >
      <BoltHead corner="tl" />
      <BoltHead corner="tr" />
      <BoltHead corner="bl" />
      <BoltHead corner="br" />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.34em] font-display text-plateEtch">
            {app} Transformer &middot; {std}
          </div>
          <div className="text-[26px] font-display uppercase mt-1" style={{ color: '#E8B887' }}>
            {params.kva} kVA &middot; {params.hv / 1000} kV to {params.lv} V
          </div>
        </div>

        <div className="sm:text-right">
          <div className="text-[10px] uppercase tracking-[0.34em] font-display text-plateEtch">
            Delivered Price Incl. GST
          </div>
          <div
            className="text-[22px] font-mono mt-0.5"
            // section 83: amber for a design nothing was assessed against
            style={{ color: design.complianceState === 'passed' ? '#9FD3C4' : design.complianceState === 'notAssessed' ? '#D9B282' : '#E3A08C' }}
          >
            {inr(bom.withGst)}
          </div>
          <div className="text-[10px] font-display text-plateEtch mt-0.5">
            Ex-works {inr(bom.exFactory)}
          </div>
        </div>
      </div>

      <div className="h-px my-4" style={{ background: '#33454E' }} />

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-4 gap-x-3 px-4 pb-1">
        {cells.map(([label, value]) => (
          <Cell key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}
