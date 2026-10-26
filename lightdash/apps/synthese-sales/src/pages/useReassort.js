// Data of the Réassort page. The volumetry reads the same repeat orders as the Réassorts row
// of the Synthèse typology, so both pages show the same figures for the same filters.
import {
  first, minus, n, ratio, status, sum, useObjectives, useQuery,
} from '../lib/data';
import {
  between, F, gapMetric, OL, Q, REPEAT_OL, REPEAT_TX, scopeFilters, SKIN_SHELVES, TEAM, TX,
} from '../lib/model';
import { DECILES } from '../lib/view';

// is_skin comes back as a boolean or as its text depending on the warehouse driver.
const skinIs = (flag) => (r) => String(r[F.tx.skin]) === String(flag);
const pick = (res, pred) => (res.data || []).find(pred);
const read = (row, field) => n(row?.[field]);

function useDelays(view) {
  const { grain, win } = view;
  const gap = gapMetric(grain);
  const inWin = between(F.tx.date, win.start, win.end);
  const scope = scopeFilters(F.tx, view);
  const all = useQuery(Q.delays[grain], TX, [...scope, inWin]);
  const seg = useQuery(Q.delaySegments[grain], TX, [...scope, inWin]);
  // The décile table lists every décile: it ignores the Décile filter, which a row click sets.
  const dec = useQuery(Q.delayDeciles[grain], TX, [...scopeFilters(F.tx, { ...view, deciles: [] }), inWin]);

  const skin = pick(seg, skinIs(true));
  const deo = pick(seg, skinIs(false));
  const deciles = (flag) => DECILES
    .map((d) => {
      const r = pick(dec, (row) => String(row[F.tx.decile]) === d.v && skinIs(flag)(row));
      return { ...d, pharmacies: read(r, F.tx.reordering), days: read(r, gap) };
    })
    .filter((d) => d.pharmacies);

  return {
    ...status(all, seg, dec),
    lineage: { delays: all.lineage, segments: seg.lineage, deciles: dec.lineage },
    data: {
      gap: first(all, gap), gapSimple: first(all, F.tx.gap), pharmacies: first(all, F.tx.reordering),
      gapSkin: read(skin, gap), gapDeo: read(deo, gap),
      delay: first(all, F.tx.openingDelay), delayCount: first(all, F.tx.firstRepeats),
      delaySkin: read(skin, F.tx.openingDelay), delayDeo: read(deo, F.tx.openingDelay),
      deciles: { skin: deciles(true), deo: deciles(false) },
    },
  };
}

function useVolume(view, obj) {
  const { win, winN1 } = view;
  const scope = [...scopeFilters(F.tx, view), ...REPEAT_TX];
  const inWin = between(F.tx.date, win.start, win.end);
  const cur = useQuery(Q.repeat, TX, [...scope, inWin]);
  const prev = useQuery(Q.repeatN1, TX, [...scope, between(F.tx.date, winN1.start, winN1.end)]);
  const teams = useQuery(Q.repeatTeams, TX, [...scope, inWin]);
  const seg = useQuery(Q.repeatSegments, TX, [...scope, inWin]);
  const shelves = useQuery(Q.repeatShelves, OL, [
    ...scopeFilters(F.ol, view), ...REPEAT_OL, between(F.ol.date, win.start, win.end),
  ]);

  // No repeat order in the period is a zero, not a missing value (as on the Synthèse).
  const total = first(cur, F.tx.total) ?? 0;
  const orders = first(cur, F.tx.orders) ?? 0;
  const prevTotal = first(prev, F.tx.total) ?? 0;
  const prevOrders = first(prev, F.tx.orders) ?? 0;
  const team = (t) => read(pick(teams, (r) => r[F.tx.team] === t), F.tx.orders) ?? 0;
  const segAov = (flag) => {
    const r = pick(seg, skinIs(flag));
    return ratio(read(r, F.tx.total), read(r, F.tx.orders));
  };
  // Skin* and Déo come from the order lines, like the CA par gamme block of the Synthèse.
  const lines = sum(shelves.data, F.ol.total);
  const linesSkin = sum(shelves.data, F.ol.total, (r) => SKIN_SHELVES.includes(r[F.ol.shelf]));

  return {
    ...status(cur, prev, teams, seg, shelves, obj.res, obj.aovRes),
    lineage: {
      repeat: cur.lineage, teams: teams.lineage, segments: seg.lineage, shelves: shelves.lineage,
      objectives: obj.res.lineage,
    },
    data: {
      orders, ordersObj: obj.flow(F.hq.nbRepeat), ordersPrev: prevOrders,
      terrain: team(TEAM.terrain), terrainObj: obj.flow(F.hq.nbRepeat, obj.isTeam(TEAM.terrain)),
      is: team(TEAM.is), isObj: obj.flow(F.hq.nbRepeat, obj.isTeam(TEAM.is)),
      aov: ratio(total, orders), aovObj: obj.aov(F.hq.aovRepeat), aovPrev: ratio(prevTotal, prevOrders),
      aovSkin: segAov(true), aovDeo: segAov(false),
      ca: total, caInvoiced: first(cur, F.tx.invoiced), caObj: obj.flow(F.hq.caRepeat), caPrev: prevTotal,
      caSkin: linesSkin, caDeo: minus(lines, linesSkin),
    },
  };
}

export function useReassort(view) {
  const obj = useObjectives(view);
  return { delays: useDelays(view), volume: useVolume(view, obj) };
}
