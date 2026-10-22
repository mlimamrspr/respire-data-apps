import clsx from 'clsx';
import { attain, eurCompact } from '../../lib/kpi';
import { StatusPill } from './StatusPill';
import { DeltaN1 } from './DeltaN1';
import { Obj } from './Meta';

const COLS = ['Réel', 'Réel + en cours'];

// rows: [{ key, name, dot, sub, cells: [{ value, obj, prev }, { value, obj, prev }] }].
// SUN is included in Skin*: rows are never summed.
export function GammeMatrix({ rows, ...rest }) {
  return (
    <div className="rd-matrix" role="table" aria-label="CA par gamme" {...rest}>
      <div className="rd-matrix__colhead" />
      {COLS.map((c) => <div key={c} className="rd-matrix__colhead">{c}</div>)}
      {rows.map((r) => [
        <div key={`${r.key}-h`} className={clsx('rd-matrix__rowhead', r.sub && 'rd-matrix__rowhead--sub')}>
          <span className={`rd-dot rd-dot--${r.dot}`} />{r.name}
        </div>,
        ...r.cells.map((c, i) => (
          <div key={`${r.key}-${i}`} className="rd-matrix__cell">
            <span className="rd-value rd-value--md">{eurCompact(c.value)}</span>
            <div className="rd-row"><StatusPill pct={attain(c.value, c.obj)} sm /></div>
            <div className="rd-meta"><Obj value={c.obj} fmt={eurCompact} /></div>
            <DeltaN1 cur={c.value} prev={c.prev} />
          </div>
        )),
      ])}
    </div>
  );
}
