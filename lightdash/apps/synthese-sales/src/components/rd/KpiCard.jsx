import clsx from 'clsx';
import { StatusPill } from './StatusPill';
import { Meta } from './Meta';
import { Breakdown } from './Breakdown';

// children sit between the head and the meta line (ProgressBar, SplitBar); breakdown comes last.
// neutral: % of a final objective with no status (upcoming TF).
export function KpiCard({
  label, channel, dot, value, size = 'lg', pct, neutral = false, children, meta, sub, breakdown, ...rest
}) {
  return (
    <div className="rd-card" {...rest}>
      <div className={clsx('rd-card__label', channel && `rd-card__label--${channel}`)}>
        {dot && <span className={`rd-dot rd-dot--${dot}`} />}{label}
      </div>
      <div className="rd-card__head">
        <span className={`rd-value rd-value--${size}`}>{value}</span>
        <StatusPill pct={pct} neutral={neutral} suffix={neutral ? 'de l’obj' : 'vs obj'} />
      </div>
      {children}
      <Meta items={meta} />
      {sub?.length > 0 && (
        <div className="rd-card__sub">
          {sub.map((s) => (
            <div key={s.label} className="rd-subkpi">
              <span><strong>{s.value}</strong>{s.label}</span>
              <StatusPill pct={s.pct} sm suffix={false} />
            </div>
          ))}
        </div>
      )}
      <Breakdown items={breakdown} />
    </div>
  );
}
