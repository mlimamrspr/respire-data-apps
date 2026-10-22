import { Fragment } from 'react';

// Meta line: items separated by a middle dot, empty items dropped.
export function Meta({ items }) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="rd-meta">
      {list.map((c, i) => (
        <Fragment key={i}>{i > 0 && <span className="rd-meta__sep">·</span>}{c}</Fragment>
      ))}
    </div>
  );
}

const missing = (v) => v == null || !Number.isFinite(Number(v)) || Number(v) === 0;

// "Obj 7,32 M€", or "Obj n.d." when the objective is missing (never invented).
export const Obj = ({ value, fmt, lower = false }) => (
  <span>{lower ? 'obj' : 'Obj'} {missing(value) ? 'n.d.' : fmt(value)}</span>
);
