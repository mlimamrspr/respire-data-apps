import clsx from 'clsx';
import { STATUS_TITLE, pct as fmtPct, status } from '../../lib/kpi';

// Icons copied from design-system/components/StatusPill/README.md (16×16, before the number).
const ICONS = {
  ok: (
    <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.5" fill="currentColor" /><path className="rd-pill__cut" d="M4.6 8.3l2.2 2.2 4.6-4.8" fill="none" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  warn: (
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2l7.3 13.3H.7z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /><path className="rd-pill__cut" d="M8 5.8v4" fill="none" strokeWidth="1.7" strokeLinecap="round" /><circle className="rd-pill__cut" cx="8" cy="12.2" r="0.9" /></svg>
  ),
  bad: (
    <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.5" fill="currentColor" /><path className="rd-pill__cut" d="M5.4 5.4l5.2 5.2M10.6 5.4l-5.2 5.2" fill="none" strokeWidth="1.9" strokeLinecap="round" /></svg>
  ),
};

// pct = unrounded attainment on a 0-100 scale; no objective → no pill.
export function StatusPill({ pct, sm = false, suffix = 'vs obj', neutral = false }) {
  if (pct == null || !Number.isFinite(pct)) return null;
  const s = neutral ? 'neutral' : status(pct);
  return (
    <span className={clsx('rd-pill', `rd-pill--${s}`, sm && 'rd-pill--sm')} title={STATUS_TITLE[s]}>
      {!neutral && ICONS[s]}
      {fmtPct(pct)}
      {suffix && <> <span className="rd-pill__suffix">{suffix}</span></>}
    </span>
  );
}

export function StatusLegend() {
  return (
    <div className="rd-legend" aria-label="Légende des statuts">
      {['ok', 'warn', 'bad'].map((s) => (
        <span key={s} className={`rd-pill rd-pill--${s} rd-pill--sm`}>{ICONS[s]}{STATUS_TITLE[s]}</span>
      ))}
      <span className="rd-meta">≥ 100 % · 70–99 % · &lt; 70 %</span>
    </div>
  );
}
