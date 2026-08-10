import React from 'react';

/**
 * DRAWINGS.md "Universal requirements" -- the three pieces every one of the
 * twenty-one drawings is built from. Nothing here is drawing-specific; a
 * drawing component supplies geometry and labels, these supply the
 * dimension lines, the title block and the fit-to-viewBox scale.
 */

/* ------------------------------------------------------------------
   Scaling: fit real-world geometry (mm) into an SVG viewBox with a
   margin. The only place a scale number is computed -- no drawing may
   hardcode one.
   ------------------------------------------------------------------ */

export interface Fit {
  scale: number;   // viewBox units per mm
  offsetX: number; // viewBox units to add so the geometry is centred
  offsetY: number;
}

export function fitToViewBox(extentW: number, extentH: number, viewBoxW: number, viewBoxH: number, margin: number): Fit {
  const availW = Math.max(1, viewBoxW - 2 * margin);
  const availH = Math.max(1, viewBoxH - 2 * margin);
  const scale = Math.min(availW / Math.max(1, extentW), availH / Math.max(1, extentH));
  return {
    scale,
    offsetX: (viewBoxW - extentW * scale) / 2,
    offsetY: (viewBoxH - extentH * scale) / 2,
  };
}

/** "1:N" for the title block. Derived from the fitted scale, never typed in
 *  by hand -- DRAWINGS.md: "No hardcoded scale factors." */
export function scaleLabel(fit: Fit): string {
  if (fit.scale <= 0 || !isFinite(fit.scale)) return 'n/a';
  return fit.scale >= 1 ? `${fit.scale.toFixed(2)}:1` : `1:${Math.round(1 / fit.scale)}`;
}

/** Diameters carry the diameter symbol, radii an R prefix -- DRAWINGS.md,
 *  Universal requirements, Dimension lines. */
export function dimText(value: number, opts?: { diameter?: boolean; radius?: boolean; decimals?: number }): string {
  const decimals = opts?.decimals ?? 0;
  const n = value.toFixed(decimals);
  if (opts?.diameter) return `⌀${n}`;
  if (opts?.radius) return `R${n}`;
  return n;
}

/* ------------------------------------------------------------------
   Shared across every drawing: numbering and the rating line, so no two
   drawings derive them differently.
   ------------------------------------------------------------------ */

const pad2 = (n: number) => String(Math.max(0, n) || 0).padStart(2, '0');

/** `{docPrefix}-{tender}-R{rev}-D{seq}` -- same family as documentRegister()'s
 *  own numbering (docPrefix-tender-Rrev-seq), with a D so a drawing number
 *  never collides with that register's own sequence 1-28. */
export function drawingNo(project: any, seq: string): string {
  const prefix = project?.docPrefix || 'TDE';
  const tender = project?.tender || 'ENQ';
  const rev = pad2(project?.revision ?? 0);
  return `${prefix}-${tender}-R${rev}-D${seq}`;
}

export function ratingLabel(params: any): string {
  return `${params.kva} kVA, ${params.hv / 1000} kV / ${params.lv} V`;
}

/* ------------------------------------------------------------------
   Dimension lines: two extension lines, a dimension line with arrow
   terminators at both ends, the value in monospace centred on it.
   ------------------------------------------------------------------ */

/** One <marker> definition, referenced by every dimension line in a
 *  drawing. `id` must be unique per <svg> (drawings render side by side
 *  on the same page, so a shared literal id would collide). */
export function DimensionArrow({ id, color = 'var(--color-ink2)' }: { id: string; color?: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX={5} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 Z" fill={color} />
      </marker>
    </defs>
  );
}

interface DimLineProps {
  label: string;
  arrowId: string;
  color?: string;
  fontSize?: number;
}

/** A dimension line has its own background chip behind the text so the
 *  monospace value reads clearly sitting on the line, rather than the line
 *  cutting through it -- SVG has no native "break the line for text" the
 *  way a CAD leader font does. */
function LabelChip({ x, y, label, fontSize, rotate }: { x: number; y: number; label: string; fontSize: number; rotate?: number }) {
  const w = label.length * fontSize * 0.62 + 4;
  const h = fontSize + 2;
  const transform = rotate ? `rotate(${rotate} ${x} ${y})` : undefined;
  return (
    <g transform={transform}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="var(--color-sheet)" />
      <text
        x={x} y={y} textAnchor="middle" dominantBaseline="central"
        className="font-mono" fontSize={fontSize} fill="var(--color-ink2)"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Horizontal dimension between two points at the same feature height
 * (featureY), with the dimension line itself offset to dimY (above or
 * below the feature -- extension lines bridge the gap either way).
 */
export function DimensionHorizontal({
  x1, x2, featureY, dimY, label, arrowId, color = 'var(--color-ink2)', fontSize = 6.5,
}: DimLineProps & { x1: number; x2: number; featureY: number; dimY: number }) {
  const over = 2.5;
  const extEnd = dimY + (featureY <= dimY ? -over : over);
  const [lo, hi] = x1 <= x2 ? [x1, x2] : [x2, x1];
  return (
    <g>
      <line x1={x1} y1={featureY} x2={x1} y2={extEnd} stroke={color} strokeWidth={0.5} />
      <line x1={x2} y1={featureY} x2={x2} y2={extEnd} stroke={color} strokeWidth={0.5} />
      <line
        x1={lo} y1={dimY} x2={hi} y2={dimY} stroke={color} strokeWidth={0.6}
        markerStart={`url(#${arrowId})`} markerEnd={`url(#${arrowId})`}
      />
      <LabelChip x={(lo + hi) / 2} y={dimY} label={label} fontSize={fontSize} />
    </g>
  );
}

/** Vertical dimension, text rotated ninety degrees -- DRAWINGS.md,
 *  Universal requirements: "Vertical dimensions rotate their text ninety
 *  degrees." */
export function DimensionVertical({
  y1, y2, featureX, dimX, label, arrowId, color = 'var(--color-ink2)', fontSize = 6.5,
}: DimLineProps & { y1: number; y2: number; featureX: number; dimX: number }) {
  const over = 2.5;
  const extEnd = dimX + (featureX <= dimX ? -over : over);
  const [lo, hi] = y1 <= y2 ? [y1, y2] : [y2, y1];
  return (
    <g>
      <line x1={featureX} y1={y1} x2={extEnd} y2={y1} stroke={color} strokeWidth={0.5} />
      <line x1={featureX} y1={y2} x2={extEnd} y2={y2} stroke={color} strokeWidth={0.5} />
      <line
        x1={dimX} y1={lo} x2={dimX} y2={hi} stroke={color} strokeWidth={0.6}
        markerStart={`url(#${arrowId})`} markerEnd={`url(#${arrowId})`}
      />
      <LabelChip x={dimX} y={(lo + hi) / 2} label={label} fontSize={fontSize} rotate={-90} />
    </g>
  );
}

/** "State 'all dimensions in mm' once per sheet." -- render it once,
 *  inside the drawing's own SVG so it travels with an exported image. */
export function UnitsNote({ x, y }: { x: number; y: number }) {
  return (
    <text x={x} y={y} className="font-mono" fontSize={6} fill="var(--color-steel)">
      ALL DIMENSIONS IN MM
    </text>
  );
}

/* ------------------------------------------------------------------
   Projection symbol: first angle for IS/IEC/CBIP/SANS/ECBC (GOST is the
   same family, not offered by this engine), third angle for ANSI (IEEE
   is the same family, likewise not offered). The pictorial symbol alone
   is not trusted to carry this -- DRAWINGS.md is explicit that reading it
   backwards reads the drawing back to front -- so the word label beside
   it is never dropped in favour of the icon.
   ------------------------------------------------------------------ */

export function isThirdAngle(standard: string): boolean {
  return standard === 'ANSI';
}

function ProjectionSymbol({ thirdAngle }: { thirdAngle: boolean }) {
  // A frustum's two views: the circle (small end, on axis) and the
  // trapezoid (side view, large end to small end). First angle places the
  // trapezoid before the circle in the direction of projection; third
  // angle reverses it.
  const trapezoid = <path d="M1,3 L1,13 L11,10.5 L11,5.5 Z" fill="none" stroke="var(--color-ink)" strokeWidth={0.6} />;
  const circle = <circle cx={19} cy={8} r={3.2} fill="none" stroke="var(--color-ink)" strokeWidth={0.6} />;
  const link = <line x1={11} y1={8} x2={15.8} y2={8} stroke="var(--color-ink)" strokeWidth={0.4} />;
  return (
    <svg width={22} height={16} viewBox="0 0 22 16">
      {thirdAngle ? (
        <>
          <circle cx={3.2} cy={8} r={3.2} fill="none" stroke="var(--color-ink)" strokeWidth={0.6} />
          <line x1={6.4} y1={8} x2={11} y2={8} stroke="var(--color-ink)" strokeWidth={0.4} />
          <path d="M11,5.5 L11,10.5 L21,13 L21,3 Z" fill="none" stroke="var(--color-ink)" strokeWidth={0.6} />
        </>
      ) : (
        <>
          {trapezoid}
          {link}
          {circle}
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------
   Title block.
   ------------------------------------------------------------------ */

export interface TitleBlockProps {
  drawingNo: string;
  title: string;
  rev: number;
  sheet: number;
  totalSheets: number;
  fit: Fit;
  standard: string;
  projectName: string;
  customer: string;
  ratingLabel: string;
  /** Only when the sheet describes a single physical part -- DRAWINGS.md:
   *  "material where the sheet describes one part, part number where
   *  applicable." Omit both for an assembly or a multi-part sheet. */
  material?: string;
  partNumber?: string;
}

function Cell({ label, value, mono = true, className = '' }: { label: string; value: React.ReactNode; mono?: boolean; className?: string }) {
  return (
    <div className={`px-2 py-1 border-r border-line last:border-r-0 ${className}`}>
      <div className="text-[8px] font-display uppercase tracking-[0.12em] text-steel leading-none">{label}</div>
      <div className={`text-[11px] text-ink mt-0.5 ${mono ? 'font-mono' : ''} truncate`}>{value}</div>
    </div>
  );
}

/** A field the approval workflow has not been built yet (TASKS.md), so it
 *  is a blank rule to be signed rather than a placeholder name --
 *  DRAWINGS.md: "An unsigned drawing is honest; an invented approver is
 *  not." */
function SignatureCell({ label }: { label: string }) {
  return (
    <div className="px-2 py-1 border-r border-line last:border-r-0">
      <div className="text-[8px] font-display uppercase tracking-[0.12em] text-steel leading-none">{label}</div>
      <div className="border-b border-ink2 mt-2.5 h-0" />
    </div>
  );
}

export function TitleBlock({
  drawingNo, title, rev, sheet, totalSheets, fit, standard, projectName, customer,
  ratingLabel, material, partNumber,
}: TitleBlockProps) {
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const thirdAngle = isThirdAngle(standard);

  return (
    <div className="border border-rule rounded-[2px] bg-white text-ink mt-2">
      <div className="grid grid-cols-2 border-b border-line">
        <Cell label="Project" value={projectName || 'Untitled Design'} mono={false} />
        <Cell label="Customer" value={customer || 'to be specified'} mono={false} />
      </div>
      <div className="grid grid-cols-[1fr_auto] border-b border-line">
        <Cell label="Title" value={title} mono={false} />
        <Cell label="Rating" value={ratingLabel} />
      </div>
      <div className="grid grid-cols-[1.3fr_0.5fr_0.7fr_0.6fr_auto]">
        <Cell label="Drawing No." value={drawingNo} />
        <Cell label="Rev" value={rev} />
        <Cell label="Sheet" value={`${sheet} of ${totalSheets}`} />
        <Cell label="Scale" value={scaleLabel(fit)} />
        <div className="px-2 py-1 flex items-center gap-1.5">
          <ProjectionSymbol thirdAngle={thirdAngle} />
          <span className="text-[8px] font-display uppercase tracking-[0.1em] text-steel leading-tight">
            {thirdAngle ? '3rd Angle' : '1st Angle'}
          </span>
        </div>
      </div>
      {(material || partNumber) && (
        <div className="grid grid-cols-2 border-t border-line">
          <Cell label="Material" value={material || 'to be specified'} mono={false} />
          <Cell label="Part No." value={partNumber || 'to be specified'} />
        </div>
      )}
      <div className="grid grid-cols-4 border-t border-line">
        <SignatureCell label="Designer" />
        <SignatureCell label="Checker" />
        <SignatureCell label="Approved" />
        <Cell label="Date" value={date} />
      </div>
    </div>
  );
}
