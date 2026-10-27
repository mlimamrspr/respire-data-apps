// Data of the TF passés page, driven by its Année selector instead of the period controls.
// Cards and history give the landing of each closed TF: DN, packs and invoiced turnover
// all-time. The billed panel reuses the queries of the Synthèse "Temps forts" line on the
// year to date of the selected year.
import {
  first, n, ratio, status, useObjectives, useQuery,
} from '../lib/data';
import {
  between, F, OP, Q, scopeFilters, SPLIT, TF_DONE, TX,
} from '../lib/model';
import { periodWindow, previousYear } from '../lib/period';
import { TIERS, tfName } from './useTFLive';

const day = (v) => (v ? String(v).slice(0, 10) : null);
const rowOf = (res, field, value) => (res.data || []).find((r) => r[field] === value);
const THIS_YEAR = String(new Date().getFullYear());

export function useTFPast(view, year) {
  const { canal, deciles } = view;
  const scope = [...scopeFilters(F.op, view), ...TF_DONE];
  const camp = useQuery(Q.tfPastCampaigns, OP, scope);
  const txScope = scopeFilters(F.tx, view);
  const invoiced = useQuery(Q.tfPastInvoiced, TX, txScope);

  // TF objectives are national and all channels: none under a Canal or Décile filter.
  const hasObj = canal === 'all' && !deciles.length;
  const tfObj = (row, field) => (hasObj ? n(row?.[field]) : null);

  const all = (camp.data || [])
    .map((r) => {
      const tag = r[F.op.tf];
      const packs = n(r[F.op.packs]) ?? 0;
      const ca = n(rowOf(invoiced, F.tx.preorderType, tag)?.[F.tx.invoiced]) ?? 0;
      return {
        tag,
        name: tfName(tag),
        done: true,
        start: day(r[F.op.start]),
        end: day(r[F.op.end]),
        dn: n(r[F.op.dn]) ?? 0,
        dnObj: tfObj(r, F.op.dnObj),
        packs,
        packsObj: tfObj(r, F.op.packsObj),
        ca,
        caNote: 'facturé all-time',
        caPerPack: packs ? ca / packs : null,
        // A tier shows when it has an objective or packs.
        tiers: TIERS
          .map((t) => ({ ...t, real: n(r[F.op[t.key]]) ?? 0, obj: tfObj(r, F.op[`${t.key}Obj`]) }))
          .filter((t) => t.obj != null || t.real > 0),
      };
    })
    .sort((a, b) => (a.start < b.start ? 1 : -1));

  // A TF belongs to the year of its start (A_VALIDER 4.2); the current year until the TF are loaded.
  const years = [...new Set(all.map((t) => t.start.slice(0, 4)))].sort().reverse();
  const shown = years.includes(year) ? year : (years[0] ?? THIS_YEAR);
  const tfs = all.filter((t) => t.start.startsWith(shown));

  // Billed panel: year to date of the selected year, n-1 = the same window a year earlier.
  const win = periodWindow('ytd', shown);
  const winN1 = previousYear(win);
  const billedScope = [
    ...txScope,
    { field: F.tx.split, operator: 'equals', value: [SPLIT.preorders] },
    { field: F.tx.type, operator: 'equals', value: ['order'] },
  ];
  const billed = useQuery(Q.tfBilled, TX, [...billedScope, between(F.tx.date, win.start, win.end)]);
  const billedN1 = useQuery(Q.tfBilledN1, TX, [...billedScope, between(F.tx.date, winN1.start, winN1.end)]);
  const byTf = useQuery(Q.tfBilledByTf, TX, [...billedScope, between(F.tx.date, win.start, win.end)]);
  const obj = useObjectives({ ...view, win });

  const total = first(billed, F.tx.total) ?? 0;
  const orders = first(billed, F.tx.orders) ?? 0;
  const totalN1 = first(billedN1, F.tx.total);
  const ordersN1 = first(billedN1, F.tx.orders);

  return {
    ...status(camp, invoiced, billed, billedN1, byTf, obj.res, obj.aovRes),
    lineage: {
      campaigns: camp.lineage, invoiced: invoiced.lineage,
      billed: billed.lineage, byTf: byTf.lineage, objectives: obj.res.lineage,
    },
    data: {
      years,
      year: shown,
      win,
      tfs,
      billed: {
        total, totalObj: obj.flow(F.hq.caPreorders), totalN1,
        orders,
        aov: ratio(total, orders), aovObj: obj.aov(F.hq.aovPreorders), aovN1: ratio(totalN1, ordersN1),
      },
      byTf: (byTf.data || []).map((r) => {
        const tag = r[F.tx.preorderType] ?? 'Sans étiquette';
        return { tag, name: tfName(tag), ca: n(r[F.tx.total]) ?? 0 };
      }),
    },
  };
}
