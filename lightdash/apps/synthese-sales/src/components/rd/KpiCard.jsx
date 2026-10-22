import clsx from 'clsx';
import { StatusPill } from './StatusPill';
import { Meta } from './Meta';

// children sit between the head and the meta line (ProgressBar, SplitBar).
export function KpiCard({
  label, channel, dot, value, size = 'lg', pct, children, meta, sub, ...rest
}) {
  return (
    <div className="rd-card" {...rest}>
      <div className={clsx('rd-card__label', channel && `rd-card__label--${channel}`)}>
        {dot && <span className={`rd-dot rd-dot--${dot}`} />}{label}
      </div>
      <div className="rd-card__head">
        <span className={`rd-value rd-value--${size}`}>{value}</span>
        <StatusPill pct={pct} />
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
    </div>
  );
}
