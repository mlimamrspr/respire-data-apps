import { attain, int } from '../../lib/kpi';
import { StatusPill } from './StatusPill';

// items: { key, name, real, obj, neutral, meta }. Heights are % of the largest real or objective.
export function ColumnChart({ items, height = 160, fmt = int, ...rest }) {
  const top = Math.max(0, ...items.flatMap((i) => [i.real ?? 0, i.obj ?? 0]));
  const scale = (v) => (top > 0 ? ((Math.max(v ?? 0, 0) / top) * 100).toFixed(1) : '0.0');
  return (
    <div className="rd-cols" {...rest}>
      {items.map((i) => (
        <div key={i.key} className="rd-colitem">
          <div
            className="rd-col"
            style={{ '--h': `${height}px`, '--fill': scale(i.real), '--obj': i.obj == null ? '0.0' : scale(i.obj) }}
            role="img"
            aria-label={`${i.name} : ${fmt(i.real)} sur ${i.obj == null ? 'objectif n.d.' : fmt(i.obj)}`}
          >
            {i.obj != null && <div className="rd-col__obj" />}
            <div className="rd-col__fill" />
            {i.obj != null && <div className="rd-col__objline" />}
            <span className="rd-col__val">{fmt(i.real)}</span>
          </div>
          <span className="rd-colitem__name" title={i.name}>{i.name}</span>
          <span className="rd-colitem__foot">
            <StatusPill pct={attain(i.real, i.obj)} sm suffix={false} neutral={i.neutral} />
            <span className="rd-colitem__meta">{i.meta}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
