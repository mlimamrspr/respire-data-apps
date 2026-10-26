import clsx from 'clsx';
import { attain, eurCompact } from '../../lib/kpi';
import { StatusPill } from './StatusPill';
import { deltaN1 } from './DeltaN1';
import { Meta, Obj } from './Meta';

const COLS = ['Réel', 'Réel + en cours'];

// rows: [{ key, name, dot, sub, cells: [{ value, obj, prev }, { value, obj, prev }] }].
// SUN is included in Skin*: Déo + Skin* + Avoirs non affectés make the global turnover.
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
            <div className="rd-row">
              <span className="rd-value rd-value--md">{eurCompact(c.value)}</span>
              <StatusPill pct={attain(c.value, c.obj)} sm />
            </div>
            <Meta items={[<Obj value={c.obj} fmt={eurCompact} />, deltaN1(c.value, c.prev)]} />
          </div>
        )),
      ])}
    </div>
  );
}
