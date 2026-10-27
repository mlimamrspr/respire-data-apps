import { useState } from 'react';
import {
  addDays, addMonths, format, isSameMonth, parseISO, startOfMonth, startOfWeek,
} from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { customKey, parseCustom } from '../../lib/period';

const MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const DAY_YEAR = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const FULL = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const iso = (d) => format(d, 'yyyy-MM-dd');
// The end of the window sits in the right-hand month.
const leftMonth = (end) => startOfMonth(addMonths(parseISO(end), -1));
const sorted = (a, b) => (a <= b ? [a, b] : [b, a]);

function rangeLabel({ start, end }) {
  const s = parseISO(start);
  const e = parseISO(end);
  if (start === end) return DAY_YEAR.format(s);
  return `${s.getFullYear() === e.getFullYear() ? DAY.format(s) : DAY_YEAR.format(s)} – ${DAY_YEAR.format(e)}`;
}

const Chevron = ({ dir }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true"><path d={dir === 'prev' ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'} /></svg>
);

// One month grid, Monday first, always six weeks so both months keep the same height.
// Days of the neighbouring months stay blank: the other grid already shows them.
function Month({ month, range, today, onPick, onHover }) {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));
  return (
    <div className="rd-cal__month">
      <div className="rd-cal__title">{MONTH.format(month)}</div>
      <div className="rd-cal__grid" role="grid" onMouseLeave={() => onHover(null)}>
        {WEEKDAYS.map((w, i) => <span key={i} className="rd-cal__wd" aria-hidden="true">{w}</span>)}
        {days.map((d) => {
          const key = iso(d);
          if (!isSameMonth(d, month)) return <span key={key} className="rd-cal__cell" />;
          const [s, e] = range;
          const inRange = key >= s && key <= e;
          const cls = [
            'rd-cal__cell',
            inRange && 'is-in',
            key === s && 'is-start',
            key === e && 'is-end',
          ].filter(Boolean).join(' ');
          return (
            <span key={key} className={cls}>
              <button
                type="button"
                className={`rd-cal__day${key === today ? ' is-today' : ''}`}
                aria-label={FULL.format(d)}
                aria-pressed={key === s || key === e}
                onClick={() => onPick(key)}
                onMouseEnter={() => onHover(key)}
                onFocus={() => onHover(key)}
              >
                {d.getDate()}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Custom window of the filter bar: one trigger, a two-month calendar in which a first click sets
// one bound and a second click the other, as in Google Calendar. No bound on dates (A_VALIDER 9.d).
export function DateRange({ value, onChange, disabled = false, title }) {
  const w = parseCustom(value);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [hover, setHover] = useState(null);
  const [month, setMonth] = useState(() => leftMonth(w?.end ?? iso(new Date())));
  const today = iso(new Date());

  const toggle = (next) => {
    setOpen(next);
    setAnchor(null);
    setHover(null);
    if (next && w) setMonth(leftMonth(w.end));
  };
  const pick = (d) => {
    if (!anchor) {
      setAnchor(d);
      return;
    }
    const [start, end] = sorted(anchor, d);
    onChange(customKey(start, end));
    toggle(false);
  };
  // While picking, the range follows the pointer from the first bound.
  const range = anchor ? sorted(anchor, hover ?? anchor) : [w?.start ?? '', w?.end ?? ''];

  return (
    <Popover open={open} onOpenChange={toggle}>
      <PopoverTrigger asChild disabled={disabled}>
        <button className="rd-select" type="button" disabled={disabled} title={title}>
          Période : <b>{w ? rangeLabel(w) : '—'}</b>
          <svg className="rd-select__cal" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent className="rd-menu rd-cal w-auto p-3" align="end">
        <div className="rd-cal__nav">
          <button type="button" aria-label="Mois précédent" onClick={() => setMonth(addMonths(month, -1))}><Chevron dir="prev" /></button>
          <button type="button" aria-label="Mois suivant" onClick={() => setMonth(addMonths(month, 1))}><Chevron dir="next" /></button>
        </div>
        <div className="rd-cal__months">
          {[month, addMonths(month, 1)].map((m) => (
            <Month key={iso(m)} month={m} range={range} today={today} onPick={pick} onHover={setHover} />
          ))}
        </div>
        <div className="rd-cal__foot">
          {anchor
            ? <>Début <b>{DAY_YEAR.format(parseISO(anchor))}</b> · cliquez la date de fin</>
            : <>Cliquez la date de début, puis la date de fin</>}
          {anchor && <button type="button" className="rd-cal__reset" onClick={() => setAnchor(null)}>Effacer</button>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
