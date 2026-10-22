// Period selector: granularity (Mois · Trimestre · Cycle · YTD) → list of periods → date window.
// Windows cover whole months, like the monthly objectives and the pharma-hq-dash date filter:
// YTD runs to the end of the current month. n-1 = the same window one year earlier.
import {
  endOfMonth, endOfQuarter, format, getQuarter, getYear, min as minDate, parseISO,
  startOfMonth, startOfQuarter, startOfYear, subMonths, subQuarters, subYears,
} from 'date-fns';

const MONTHS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
  'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

// Cycle stays disabled until the business provides the commercial cycle bounds (A_VALIDER 1.6).
export const GRAINS = [
  { v: 'month', l: 'Mois' },
  { v: 'quarter', l: 'Trimestre' },
  { v: 'cycle', l: 'Cycle', disabled: true, why: 'Bornes des cycles commerciaux à fournir' },
  { v: 'ytd', l: 'YTD' },
];

const N_MONTHS = 18;
const N_QUARTERS = 8;

const iso = (d) => format(d, 'yyyy-MM-dd');

// Options of the Période select, most recent first. Keys are stable strings kept in the URL.
export function periodOptions(grain, today = new Date()) {
  if (grain === 'month') {
    return Array.from({ length: N_MONTHS }, (_, i) => {
      const d = subMonths(startOfMonth(today), i);
      return { key: format(d, 'yyyy-MM'), label: `${MONTHS[d.getMonth()]} ${getYear(d)}` };
    });
  }
  if (grain === 'quarter') {
    return Array.from({ length: N_QUARTERS }, (_, i) => {
      const d = subQuarters(startOfQuarter(today), i);
      return { key: `${getYear(d)}-Q${getQuarter(d)}`, label: `T${getQuarter(d)} ${getYear(d)}` };
    });
  }
  if (grain === 'ytd') return [{ key: `${getYear(today)}`, label: `YTD ${getYear(today)}` }];
  return [];
}

export const defaultPeriod = (grain, today = new Date()) => periodOptions(grain, today)[0]?.key ?? null;

// { start, end, asOf } as ISO dates. asOf = min(end, today): the day the active park is read at.
export function periodWindow(grain, key, today = new Date()) {
  let start;
  let end;
  if (grain === 'month' && /^\d{4}-\d{2}$/.test(key || '')) {
    start = parseISO(`${key}-01`);
    end = endOfMonth(start);
  } else if (grain === 'quarter' && /^\d{4}-Q[1-4]$/.test(key || '')) {
    const [y, q] = key.split('-Q').map(Number);
    start = new Date(y, (q - 1) * 3, 1);
    end = endOfQuarter(start);
  } else if (grain === 'ytd' && /^\d{4}$/.test(key || '')) {
    start = startOfYear(new Date(Number(key), 0, 1));
    end = getYear(today) === Number(key) ? endOfMonth(today) : new Date(Number(key), 11, 31);
  } else {
    return null;
  }
  return { start: iso(start), end: iso(end), asOf: iso(minDate([end, today])), months: [iso(startOfMonth(start)), iso(startOfMonth(end))] };
}

export function previousYear(win) {
  if (!win) return null;
  const shift = (s) => iso(subYears(parseISO(s), 1));
  return { start: shift(win.start), end: shift(win.end), asOf: shift(win.asOf), months: win.months.map(shift) };
}
