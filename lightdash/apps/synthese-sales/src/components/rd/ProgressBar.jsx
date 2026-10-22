import clsx from 'clsx';
import { attain, barVars, pct as fmtPct } from '../../lib/kpi';

// series: deo | skin | sun | terrain | is (default accent for totals).
// Without an objective the bar stays an empty track: a full bar would read as 100 %.
export function ProgressBar({ real, obj, pending = 0, series, thick = false }) {
  const a = attain(real, obj);
  const hasObj = obj != null && Number.isFinite(Number(obj)) && Number(obj) !== 0;
  if (!hasObj) {
    return (
      <div
        className={clsx('rd-bar', series && `rd-bar--${series}`, thick && 'rd-bar--thick')}
        style={barVars(0, null)}
        role="img"
        aria-label="Objectif non disponible"
      />
    );
  }
  return (
    <div
      className={clsx('rd-bar', series && `rd-bar--${series}`, thick && 'rd-bar--thick')}
      style={barVars(real, obj, pending)}
      role="img"
      aria-label={a == null ? 'Objectif non disponible' : `${fmtPct(a)} de l’objectif`}
    >
      <div className="rd-bar__fill" />
      {pending > 0 && <div className="rd-bar__pend" />}
      <div className="rd-bar__obj" />
    </div>
  );
}
