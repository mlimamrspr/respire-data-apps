import { C, PAL } from './model';

export const Card = ({ children, className = '', style }) => (
  <div className={'rounded-lg border bg-white ' + className}
       style={{ borderColor: C.line, ...style }}>{children}</div>
);

export const TileHead = ({ title, note }) => (
  <div className="px-4 pt-3 pb-2">
    <div className="text-[13px] font-semibold" style={{ color: C.ink }}>{title}</div>
    {note && <div className="text-[11.5px] mt-0.5 leading-snug" style={{ color: C.mid }}>{note}</div>}
  </div>
);

// A KPI is deliberately shown twice across the dashboard: raw, then rolling.
// The delta never gets a colour — on a market being opened, "up" is not a verdict.
export const Kpi = ({ label, value, sub, delta, accent }) => (
  <Card className="px-4 py-3">
    <div className="text-[11.5px] uppercase tracking-wide" style={{ color: C.faint }}>{label}</div>
    <div className="text-[26px] font-semibold leading-tight mt-1"
         style={{ color: accent || C.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    <div className="flex items-baseline gap-2 mt-1">
      {delta && <span className="text-[12px]" style={{ color: C.mid }}>{delta}</span>}
      <span className="text-[11px]" style={{ color: C.faint }}>{sub}</span>
    </div>
  </Card>
);

export const Chip = ({ options, value, onChange, label }) => (
  <div className="flex items-center gap-1.5">
    {label && <span className="text-[11.5px]" style={{ color: C.faint }}>{label}</span>}
    <div className="flex rounded-md border overflow-hidden" style={{ borderColor: C.line }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className="px-2.5 py-1 text-[12px] transition-colors"
          style={{ background: value === o.v ? C.soft : '#fff',
                   color: value === o.v ? '#4A3BD0' : C.mid,
                   fontWeight: value === o.v ? 600 : 400 }}>{o.l}</button>
      ))}
    </div>
  </div>
);

export const Note = ({ title, items }) => (
  <Card className="px-4 py-3.5">
    <div className="text-[13px] font-semibold mb-2" style={{ color: C.ink }}>{title}</div>
    <div className="grid md:grid-cols-3 gap-x-6 gap-y-2.5">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2.5">
          <div className="shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded h-fit"
               style={{ background: C.soft, color: '#4A3BD0' }}>{it.b}</div>
          <div className="text-[12px] leading-relaxed" style={{ color: C.mid }}>{it.t}</div>
        </div>
      ))}
    </div>
  </Card>
);

export const Empty = ({ children }) => (
  <div className="flex items-center justify-center h-full text-[12px]" style={{ color: C.faint }}>{children}</div>
);

export const LEG = ({ items }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-2">
    {items.map((it, i) => (
      <span key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: C.mid }}>
        <span style={{ width: 10, height: it.h || 3, background: it.c, borderRadius: 2, display: 'inline-block' }} />
        {it.t}
      </span>
    ))}
  </div>
);
