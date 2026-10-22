import { delta } from '../../lib/kpi';

// Hidden when n-1 is missing or zero.
export function DeltaN1({ cur, prev }) {
  const d = delta(cur, prev);
  if (!d) return null;
  return <span className={`rd-delta rd-delta--${d.dir}`}>vs n-1 <b>{d.text}</b></span>;
}

// For meta lines: null (not an empty element) when hidden, so no orphan separator is drawn.
export const deltaN1 = (cur, prev) => (delta(cur, prev) ? <DeltaN1 cur={cur} prev={prev} /> : null);
