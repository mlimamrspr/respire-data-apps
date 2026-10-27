// Period selector: granularity (Mois · Trimestre · Cycle · YTD · Personnalisé) → list of periods → date window.
// Windows cover whole months, like the monthly objectives and the pharma-hq-dash date filter:
// YTD runs to the end of the current month. A custom window may cut a month: its objectives are then n.d.
import {
  endOfMonth, endOfQuarter, format, getQuarter, getYear, isValid, min as minDate, parseISO,
  startOfMonth, startOfQuarter, startOfYear, subMonths, subQuarters, subYears,
} from 'date-fns';

const MONTHS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
  'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

export const GRAINS = [
  { v: 'month', l: 'Mois' },
  { v: 'quarter', l: 'Trimestre' },
  { v: 'cycle', l: 'Cycle' },
  { v: 'ytd', l: 'YTD' },
  { v: 'custom', l: 'Personnalisé' },
];

const N_MONTHS = 18;
const N_QUARTERS = 8;

const iso = (d) => format(d, 'yyyy-MM-dd');
const day = (v) => (v ? String(v).slice(0, 10) : null);
const shift = (s) => iso(subYears(parseISO(s), 1));
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const previousCode = (code) => code.replace(/\d{4}$/, (y) => `${Number(y) - 1}`);
const cycleKey = (code) => code.replace(/^(C\d+) (\d{4})$/, '$2-$1');

// Commercial cycles of the objectives sheet ("C3 2026"), most recent first. The sheet only has the
// current year: the year before reuses the same dates (A_VALIDER 1.6), so the n-1 of each cycle exists.
export function cycleList(rows) {
  const cycles = rows
    .map((r) => ({ code: r.code, start: day(r.start), end: day(r.end) }))
    .filter((c) => /^C\d+ \d{4}$/.test(c.code || '') && DAY_RE.test(c.start || '') && DAY_RE.test(c.end || ''));
  const derived = cycles
    .filter((c) => !cycles.some((x) => x.code === previousCode(c.code)))
    .map((c) => ({ code: previousCode(c.code), start: shift(c.start), end: shift(c.end) }));
  return [...cycles, ...derived].sort((a, b) => (a.start < b.start ? 1 : -1));
}

// Custom window key kept in the URL: "2026-03-15_2026-04-20".
export const customKey = (start, end) => `${start}_${end}`;
export function parseCustom(key) {
  const [start, end] = String(key || '').split('_');
  if (!DAY_RE.test(start || '') || !DAY_RE.test(end || '')) return null;
  if (!isValid(parseISO(start)) || !isValid(parseISO(end)) || start > end) return null;
  return { start, end };
}

// Options of the Période select, most recent first. Keys are stable strings kept in the URL.
// A cycle shows once started; the custom window has no list, its dates are typed in.
export function periodOptions(grain, today = new Date(), cycles = []) {
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
  if (grain === 'cycle') {
    return cycles.filter((c) => c.start <= iso(today)).map((c) => ({ key: cycleKey(c.code), label: c.code }));
  }
  if (grain === 'ytd') return [{ key: `${getYear(today)}`, label: `YTD ${getYear(today)}` }];
  return [];
}

// A custom window opened from a bare URL starts on the current month.
export const defaultPeriod = (grain, today = new Date(), cycles = []) => (grain === 'custom'
  ? customKey(iso(startOfMonth(today)), iso(endOfMonth(today)))
  : periodOptions(grain, today, cycles)[0]?.key ?? null);

// Window shared by every page. asOf = min(end, today): the day the active park is read at.
// wholeMonths tells whether the monthly objectives apply (A_VALIDER 9.b).
function windowOf(start, end, asOf, extra = {}) {
  return {
    start,
    end,
    asOf,
    months: [iso(startOfMonth(parseISO(start))), iso(startOfMonth(parseISO(end)))],
    wholeMonths: start.endsWith('-01') && iso(endOfMonth(parseISO(end))) === end,
    ...extra,
  };
}
const upTo = (start, end, today) => windowOf(start, end, iso(minDate([parseISO(end), today])));

export function periodWindow(grain, key, today = new Date(), cycles = []) {
  if (grain === 'month' && /^\d{4}-\d{2}$/.test(key || '')) {
    const start = parseISO(`${key}-01`);
    return upTo(iso(start), iso(endOfMonth(start)), today);
  }
  if (grain === 'quarter' && /^\d{4}-Q[1-4]$/.test(key || '')) {
    const [y, q] = key.split('-Q').map(Number);
    const start = new Date(y, (q - 1) * 3, 1);
    return upTo(iso(start), iso(endOfQuarter(start)), today);
  }
  if (grain === 'cycle') {
    const c = cycles.find((x) => cycleKey(x.code) === key);
    return c ? { ...upTo(c.start, c.end, today), cycle: c.code } : null;
  }
  if (grain === 'ytd' && /^\d{4}$/.test(key || '')) {
    const start = startOfYear(new Date(Number(key), 0, 1));
    const end = getYear(today) === Number(key) ? endOfMonth(today) : new Date(Number(key), 11, 31);
    return upTo(iso(start), iso(end), today);
  }
  if (grain === 'custom') {
    const w = parseCustom(key);
    return w ? upTo(w.start, w.end, today) : null;
  }
  return null;
}

// n-1: the same cycle of the year before (A_VALIDER 9.a), otherwise the same dates one year earlier (9.c).
// The park date moves back one year too, within the n-1 window.
export function previousYear(win, cycles = []) {
  if (!win) return null;
  const prev = win.cycle && cycles.find((c) => c.code === previousCode(win.cycle));
  if (prev) {
    const asOf = [prev.end, shift(win.asOf)].sort()[0];
    return { ...windowOf(prev.start, prev.end, asOf < prev.start ? prev.start : asOf), cycle: prev.code };
  }
  return windowOf(shift(win.start), shift(win.end), shift(win.asOf));
}
