import React from 'react';

/* Shared DESIGN.md primitives, used by ResultsDisplay, TransformerForm and
   PinPanel so the same card/table/label styling isn't redefined three times. */

export const cardCls = 'bg-white border border-rule rounded-[2px]';
export const cardHeaderCls = 'bg-sheetAlt border-b border-line px-3 py-2 flex items-center justify-between';
export const cardTitleCls = 'text-[11px] font-display uppercase tracking-[0.18em] text-ink';
export const cardSubtitleCls = 'font-mono text-[10px] text-steel';
export const cardBodyCls = 'px-3 py-2';
export const thCls = 'bg-sheetAlt text-[10px] font-display uppercase tracking-[0.14em] text-ink2 text-left py-1.5 px-2';
export const tdCls = 'py-1.5 px-2 border-b border-line';
export const labelCls = 'text-[11px] font-display uppercase tracking-[0.1em] text-ink2';
export const inputCls = 'w-full bg-white border border-rule rounded-[2px] px-2 py-1.5 text-ink font-mono text-[11px] focus:outline-none focus:border-copper';

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className={cardCls}>
      <div className={cardHeaderCls}>
        <span className={cardTitleCls}>{title}</span>
        {subtitle && <span className={cardSubtitleCls}>{subtitle}</span>}
      </div>
      <div className={cardBodyCls}>{children}</div>
    </div>
  );
}

export function DataRow({ label, value, unit, tone = 'ink' }: { label: string; value: string; unit?: string; tone?: 'ink' | 'copper' | 'alert' | 'amber' }) {
  const toneCls: Record<string, string> = { ink: 'text-ink', copper: 'text-copper', alert: 'text-alert', amber: 'text-amber' };
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-dashed border-line last:border-0">
      <span className="text-[11px] text-ink2">{label}</span>
      <span className={`font-mono text-[11px] font-semibold ${toneCls[tone]}`}>
        {value}{unit && <span className="font-normal text-steel ml-1">{unit}</span>}
      </span>
    </div>
  );
}

export function CheckMark({ ok }: { ok: boolean }) {
  return <span className={ok ? 'text-good' : 'text-alert'}>{ok ? '✓' : '✗'}</span>;
}

export function Button({
  children, onClick, variant = 'secondary', disabled, type = 'button',
}: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'confirm' | 'secondary' | 'destructive'; disabled?: boolean; type?: 'button' | 'submit';
}) {
  const variantCls: Record<string, string> = {
    primary: 'bg-copper text-white border border-copper',
    confirm: 'bg-patina text-white border border-patina',
    secondary: 'bg-transparent text-ink2 border border-rule',
    destructive: 'bg-transparent text-alert border border-rule',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-display uppercase text-[11px] tracking-[0.14em] px-3 py-1.5 rounded-[2px] transition-colors disabled:bg-steel disabled:text-white disabled:border-steel ${variantCls[variant]}`}
    >
      {children}
    </button>
  );
}
