// Data of the TF en cours & à venir page. Each TF reads its all-time DN and objectives without a
// date filter; the packs and the period DN follow the period, as on the Looker "Temps forts" page.
import { n, status, useQuery } from '../lib/data';
import {
  between, F, OP, Q, scopeFilters, TF_OPEN, TX,
} from '../lib/model';

// Display names of the campaign tags; any other tag loses its PRECO prefix.
const TF_NAMES = {
  'PRECO PURIFY HYDRATE 2026': 'Purify + Hydrate 2026',
  'PRECO SOLAIRE DEO 2027': 'Solaire déo 2027',
};
const tfName = (tag) => TF_NAMES[tag]
  ?? tag.replace(/^(PRECO|TF) /, '').toLowerCase().replace(/^./, (c) => c.toUpperCase());

const TIERS = [
  { key: 'premium', label: 'Packs Premium' },
  { key: 'vip', label: 'Packs VIP' },
  { key: 'elite', label: 'Packs Élite' },
  { key: 'is', label: 'Packs IS' },
];

const day = (v) => (v ? String(v).slice(0, 10) : null);
const rowOf = (res, field, value) => (res.data || []).find((r) => r[field] === value);

export function useTFLive(view) {
  const { win, canal, deciles } = view;
  const scope = [...scopeFilters(F.op, view), ...TF_OPEN];
  const inWin = between(F.op.firstPreorder, win.start, win.end);
  const camp = useQuery(Q.tfCampaigns, OP, scope);
  const packs = useQuery(Q.tfPacks, OP, [...scope, inWin]);
  const dn = useQuery(Q.tfPeriodDn, TX, [...scopeFilters(F.tx, view), between(F.tx.orderDate, win.start, win.end)]);
  const statePacks = useQuery(Q.tfStatePacks, OP, [...scope, inWin]);
  const stateObj = useQuery(Q.tfStateObjectives, OP, scope);

  // TF objectives are national and all channels: none under a Canal or Décile filter.
  const hasObj = canal === 'all' && !deciles.length;
  const obj = (row, field) => (hasObj ? n(row?.[field]) : null);

  const tfs = (camp.data || [])
    .map((r) => {
      const tag = r[F.op.tf];
      const p = rowOf(packs, F.op.tf, tag);
      // No row in the period means no pack or no pharmacy in it: a zero, not a missing value.
      const real = (field) => n(p?.[field]) ?? 0;
      return {
        tag,
        name: tfName(tag),
        upcoming: r[F.op.state] === 'upcoming',
        start: day(r[F.op.start]),
        end: day(r[F.op.end]),
        dn: n(r[F.op.dn]) ?? 0,
        dnPeriod: n(rowOf(dn, F.tx.preorderType, tag)?.[F.tx.preordering]) ?? 0,
        dnObj: obj(r, F.op.dnObj),
        packs: real(F.op.packs),
        packsObj: obj(r, F.op.packsObj),
        // A tier shows when it has an objective or packs: Bodycare has the elite tier only.
        tiers: TIERS
          .map((t) => ({ ...t, real: real(F.op[t.key]), obj: obj(r, F.op[`${t.key}Obj`]) }))
          .filter((t) => t.obj != null || t.real > 0),
      };
    })
    .sort((a, b) => (a.start < b.start ? -1 : 1));

  const phase = (state) => ({
    packs: n(rowOf(statePacks, F.op.state, state)?.[F.op.packs]) ?? 0,
    obj: obj(rowOf(stateObj, F.op.state, state), F.op.packsObj),
    tfs: tfs.filter((t) => t.upcoming === (state === 'upcoming')),
  });

  return {
    ...status(camp, packs, dn, statePacks, stateObj),
    lineage: {
      campaigns: camp.lineage, packs: packs.lineage, dn: dn.lineage,
      statePacks: statePacks.lineage, stateObj: stateObj.lineage,
    },
    data: { tfs, live: phase('live'), upcoming: phase('upcoming') },
  };
}
