import { differenceInCalendarDays, parseISO } from 'date-fns';
import { attain, eur, eurCompact, flow, int } from '../../lib/kpi';
import { StatusPill } from './StatusPill';
import { ProgressBar } from './ProgressBar';

const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const DAY_YEAR = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

function phaseMeta({ start, end, upcoming, done }, today) {
  const s = parseISO(start);
  const e = parseISO(end);
  if (upcoming) return `Début ${DAY_YEAR.format(s)} · J-${differenceInCalendarDays(s, today)}`;
  const from = s.getFullYear() === e.getFullYear() ? DAY.format(s) : DAY_YEAR.format(s);
  if (done) return `${from} → ${DAY_YEAR.format(e)}`;
  return `${from} → ${DAY_YEAR.format(e)} · fin J-${differenceInCalendarDays(e, today)}`;
}

// An upcoming TF is compared to its final objective: neutral pill and "Reste N", not a status.
function gapText(real, obj, unit, upcoming) {
  if (obj == null) return 'Obj n.d.';
  if (upcoming) return real >= obj ? 'Objectif final atteint' : `Reste ${int(obj - real)} ${unit}`;
  return `Écart ${flow(real - obj)} ${unit}`;
}

function TFMetric({ label, real, obj, unit, upcoming }) {
  return (
    <div className="rd-tfm">
      <div className="rd-tfm__top">
        <span>{label}</span>
        <StatusPill pct={attain(real, obj)} sm suffix={false} neutral={upcoming} />
      </div>
      <div className="rd-tfm__row">
        <span className="rd-tfm__val"><b>{int(real)}</b> / {obj == null ? 'n.d.' : int(obj)}</span>
        <span className="rd-meta">{gapText(real, obj, unit, upcoming)}</span>
      </div>
      <ProgressBar real={real} obj={obj} />
    </div>
  );
}

export function TFCard({ tf, today = new Date(), ...rest }) {
  const { name, upcoming, done } = tf;
  return (
    <article className="rd-tf" aria-label={`Temps fort ${name}`} {...rest}>
      <header className="rd-tf__head">
        <div className="rd-tf__title">
          <h3 className="rd-tf__name">{name}</h3>
          {/* Turnover has no objective per TF yet (A_VALIDER 4.4): value only, no pill or bar. */}
          <span className="rd-tf__ca rd-tip" data-tip={`${eur(tf.ca)} · ${tf.caNote ?? 'date de commande'}`} tabIndex={0}>CA <b>{eurCompact(tf.ca)}</b></span>
        </div>
        <div className="rd-tf__phase">
          {done && <span className="rd-chip rd-chip--done">Terminé</span>}
          {!done && (upcoming
            ? <span className="rd-chip">À venir · précommandes</span>
            : <span className="rd-chip rd-chip--live">En cours</span>)}
          <span className="rd-meta">{phaseMeta(tf, today)}</span>
        </div>
      </header>
      <TFMetric label="DN all-time" real={tf.dn} obj={tf.dnObj} unit="pharmas" upcoming={upcoming} />
      {tf.dnPeriod != null && (
        <TFMetric label="DN sur la période" real={tf.dnPeriod} obj={tf.dnObj} unit="pharmas" upcoming={upcoming} />
      )}
      {tf.tiers.map((t) => (
        <TFMetric key={t.key} label={t.label} real={t.real} obj={t.obj} unit="packs" upcoming={upcoming} />
      ))}

    </article>
  );
}
