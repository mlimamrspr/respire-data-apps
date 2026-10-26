import { StatusPill } from './StatusPill';

// Split under a KPI (Skin / Déo, Terrain / IS): a part without objective has no pill.
export function Breakdown({ items }) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="rd-breakdown">
      {list.map((it) => (
        <span key={it.label} className="rd-breakdown__item">
          {it.dot && <span className={`rd-dot rd-dot--${it.dot}`} />}{it.label} <b>{it.value}</b>
          <StatusPill pct={it.pct} sm suffix={false} />
        </span>
      ))}
    </div>
  );
}
