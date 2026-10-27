// Query helpers shared by the page data hooks: one query per block, objectives of the view,
// and row readers. A missing value stays null (shown "—" or "Obj n.d.").
import { useMemo } from 'react';
import { useLightdash } from '@lightdash/query-sdk';
import { useGlobalFilters } from '@/lib/filters';
import { between, F, HQ, Q, TEAM } from './model';

export const n = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
export const minus = (a, b) => (a == null || b == null ? null : a - b);
export const ratio = (a, b) => (a == null || !b ? null : a / b);
export const share = (a, b) => (a == null || !b ? null : (a / b) * 100);

// Sum of a field over the rows matching pred; null when no row matches.
export function sum(rows, field, pred = () => true) {
  let total = null;
  for (const r of rows || []) {
    if (!pred(r)) continue;
    const v = n(r[field]);
    if (v != null) total = (total ?? 0) + v;
  }
  return total;
}
export const first = (res, field) => n(res.data?.[0]?.[field]);

// One query with the view filters and the app's global filters of its explore.
export function useQuery(base, explore, filters) {
  const { filtersFor } = useGlobalFilters();
  const key = JSON.stringify(filters);
  const q = useMemo(() => base.filters([...filters, ...filtersFor(explore)]), [base, explore, key, filtersFor]);
  return useLightdash(q);
}

export const status = (...results) => ({
  loading: results.some((r) => r.loading),
  error: results.find((r) => r.error)?.error ?? null,
});

// Objectives are monthly, per sales team, and not split by décile: none when a décile is selected,
// nor on a custom window that cuts a month (A_VALIDER 9.b).
export function useObjectives({ canal, deciles, win }) {
  const filters = [between(F.hq.month, win.months[0], win.months[1])];
  if (TEAM[canal]) filters.push({ field: F.hq.team, operator: 'equals', value: [TEAM[canal]] });
  const res = useQuery(Q.objectives, HQ, filters);
  const aovRes = useQuery(Q.aovObjectives, HQ, filters);
  const none = deciles.length > 0 || !win.wholeMonths;
  const rows = none ? [] : res.data;
  const asOfMonth = `${win.asOf.slice(0, 7)}-01`;
  const isTeam = (t) => (r) => r[F.hq.team] === t;
  const atAsOf = (r) => String(r[F.hq.month]).slice(0, 10) === asOfMonth;
  return {
    res,
    aovRes,
    // Flows (turnover, orders, doors) add up over the months of the window.
    flow: (field, pred) => sum(rows, field, pred),
    // Park objectives are levels: read on the month of the park date.
    level: (field, pred = () => true) => sum(rows, field, (r) => atAsOf(r) && pred(r)),
    // Average of the AOV entered over the months of the window, 0 excluded (A_VALIDER 1.17).
    aov: (field) => (none ? null : first(aovRes, field)),
    isTeam,
  };
}
