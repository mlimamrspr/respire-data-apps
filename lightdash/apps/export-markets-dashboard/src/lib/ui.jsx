// ═══════════════════════════════════════════════════════════════════════════════
// UI PRIMITIVES — every visual element of the app is built from these five.
//
// WHERE TO CHANGE WHAT
//   Colours ......... model.js → T (brand palette) then C (roles). Nothing here holds a hex.
//   Font ............ model.js → TYPE.family. Applied once, on the app root in App.jsx.
//   A tile's frame .. Card, below — border, radius, shadow.
//   A tile's header . TileHead, below — title row and the "i" button.
//   Explanations .... the `note` prop passed at the CALL SITE in App.jsx, not here.
//   Chart internals . App.jsx → Chart(), and the recharts elements inside each tab.
//
// Sizes are Tailwind arbitrary values (text-[12px]) because Tailwind cannot read a runtime
// constant. TYPE.size in model.js documents the intended scale — if you change a size, change
// every occurrence of that same value so the hierarchy stays consistent.
// ═══════════════════════════════════════════════════════════════════════════════
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { C, PAL, TYPE } from './model';

// Page and card share the sand background — the brand palette has no lighter tone to lift a
// surface with. Separation comes from a hairline border and a shadow instead of a tint.
export const Card = ({ children, className = '', style }) => (
  <div className={'rounded-lg border ' + className}
       style={{ borderColor: C.line, background: C.surface,
                boxShadow: '0 1px 2px rgba(24,20,15,.05)', ...style }}>{children}</div>
);

// The explanation lives behind an icon rather than under the title. These notes are read
// once, when someone wonders what a tile means; printed permanently they push every chart
// down the page and get skipped anyway.
// INFO BUTTON — the small "i" beside a title. Opens a popover on click.
// Explanations live behind it rather than under the title: they are read once, when someone
// wonders what a tile means, and printed permanently they push every chart down the page.
// The text itself comes from the `note` prop, written at the call site in App.jsx.
export const Info = ({ title, children }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button aria-label={`About ${title}`}
        className="shrink-0 inline-flex items-center justify-center rounded-full transition-colors"
        style={{ width: 15, height: 15, border: `1px solid ${C.line}`, color: C.faint,
                 fontSize: 10, lineHeight: 1, fontStyle: 'italic', fontWeight: 600 }}
        onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.faint; e.currentTarget.style.borderColor = C.line; }}>
        i
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" sideOffset={6}
      className="w-[340px] p-3 text-[12px] leading-relaxed"
      style={{ color: C.mid, borderColor: C.line }}>
      <div className="text-[12.5px] font-semibold mb-1.5" style={{ color: C.ink }}>{title}</div>
      {children}
    </PopoverContent>
  </Popover>
);

// TILE HEADER — the title row of every card, plus the "i" button when a note is supplied.
// Passing no `note` simply hides the button.
export const TileHead = ({ title, note, extra }) => (
  <div className="px-4 pt-3 pb-2 flex items-center gap-1.5">
    <div className="text-[13px] font-semibold" style={{ color: C.ink }}>{title}</div>
    {(note || extra) && <Info title={title}>{note}{extra}</Info>}
  </div>
);

// A KPI is deliberately shown twice across the dashboard: raw, then rolling.
// The delta never gets a colour — on a market being opened, "up" is not a verdict.
// KPI — a single figure with its label, a delta, and an optional note.
// `accent` is what separates a rolling average (accent = C.accent) from a raw value (no
// accent, so C.ink). The delta NEVER gets a colour: on a market being opened, a rise is not
// automatically bad, and a green/red rule here would assert something the data cannot.
export const Kpi = ({ label, value, sub, delta, accent, note }) => (
  <Card className="px-4 py-3">
    <div className="flex items-center gap-1.5">
      <div className="text-[11.5px] uppercase tracking-wide" style={{ color: C.faint }}>{label}</div>
      {note && <Info title={label}>{note}</Info>}
    </div>
    <div className="text-[26px] font-semibold leading-tight mt-1"
         style={{ color: accent || C.ink, fontVariantNumeric: TYPE.numeric }}>{value}</div>
    <div className="flex items-baseline gap-2 mt-1">
      {delta && <span className="text-[12px]" style={{ color: C.mid }}>{delta}</span>}
      <span className="text-[11px]" style={{ color: C.faint }}>{sub}</span>
    </div>
  </Card>
);

// CHIP GROUP — the segmented control used for Market, Grain, Window and the recap length.
// Active state is C.soft on C.accent; inactive is transparent on C.mid.
export const Chip = ({ options, value, onChange, label }) => (
  <div className="flex items-center gap-1.5">
    {label && <span className="text-[11.5px]" style={{ color: C.faint }}>{label}</span>}
    <div className="flex rounded-md border overflow-hidden" style={{ borderColor: C.line }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className="px-2.5 py-1 text-[12px] transition-colors"
          style={{ background: value === o.v ? C.soft : 'transparent',
                   color: value === o.v ? C.accent : C.mid,
                   fontWeight: value === o.v ? 600 : 400 }}>{o.l}</button>
      ))}
    </div>
  </div>
);

// NOTE BLOCK — the boxed guidance panels ("Read this before you react to a number",
// the influencer pilot, the definitions). Each item is a short badge plus a sentence.
// This is the only place long-form text is shown inline rather than behind an "i".
export const Note = ({ title, items }) => (
  <Card className="px-4 py-3.5">
    <div className="text-[13px] font-semibold mb-2" style={{ color: C.ink }}>{title}</div>
    <div className="grid md:grid-cols-3 gap-x-6 gap-y-2.5">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2.5">
          <div className="shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded h-fit"
               style={{ background: C.soft, color: C.accent }}>{it.b}</div>
          <div className="text-[12px] leading-relaxed" style={{ color: C.mid }}>{it.t}</div>
        </div>
      ))}
    </div>
  </Card>
);

// EMPTY / LOADING placeholder.
export const Empty = ({ children }) => (
  <div className="flex items-center justify-center h-full text-[12px]" style={{ color: C.faint }}>{children}</div>
);

// LEGEND — recharts' own legend is not used: this one sits under the title, above the plot,
// so it reads as part of the header rather than stealing height from the chart.
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
