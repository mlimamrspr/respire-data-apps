import { attain, eur, eurCompact, int } from '../../lib/kpi';
import { StatusPill } from './StatusPill';
import { ProgressBar } from './ProgressBar';

const paren = (v, fmt) => `(${v == null || !Number.isFinite(Number(v)) || Number(v) === 0 ? 'n.d.' : fmt(v)})`;

// rows: [{ name, real, obj, orders, ordersObj, aov, aovObj }]; AOV = CA / Nb commandes.
// One bar colour for every row: green/orange stay reserved to the status pills.
export function TypologyBars({ rows, caLabel = 'CA réel vs obj', ...rest }) {
  return (
    <div className="rd-typo" {...rest}>
      <div className="rd-typo__head">
        <span>Typologie</span>
        <span>{caLabel}</span>
        <span style={{ textAlign: 'right' }}>CA (obj)</span>
        <span>Atteinte</span>
      </div>
      {rows.map((r) => (
        <div key={r.name} className="rd-typo__row">
          <span className="rd-typo__name">{r.name}</span>
          <ProgressBar real={r.real} obj={r.obj} thick />
          <span className="rd-typo__val">
            {eurCompact(r.real)} <span className="rd-typo__obj">{paren(r.obj, eurCompact)}</span>
          </span>
          <span><StatusPill pct={attain(r.real, r.obj)} suffix={false} /></span>
          <div className="rd-typo__sub">
            <span>Cmds <b>{int(r.orders)}</b> {paren(r.ordersObj, int)} <StatusPill pct={attain(r.orders, r.ordersObj)} sm suffix={false} /></span>
            <span>AOV <b>{eur(r.aov)}</b> {paren(r.aovObj, eur)} <StatusPill pct={attain(r.aov, r.aovObj)} sm suffix={false} /></span>
          </div>
        </div>
      ))}
    </div>
  );
}
