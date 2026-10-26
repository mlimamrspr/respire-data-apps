// Data of the Synthèse page: runs the queries of lib/model.js for the current view and
// assembles the shape each panel reads. A missing value stays null (shown "—" or "Obj n.d.").
import {
  first, minus, n, ratio, share, status, sum, useObjectives, useQuery,
} from '../lib/data';
import {
  between, CU, F, HI, OL, onDay, Q, scopeFilters, SKIN_SHELVES, SPLIT, SUN_SHELF, TEAM, TX,
} from '../lib/model';

function useCa(view, obj) {
  const { gamme, win, winN1 } = view;
  const scope = scopeFilters(F.tx, view);
  const scopeOl = scopeFilters(F.ol, view);
  const ca = useQuery(Q.ca, TX, [...scope, between(F.tx.date, win.start, win.end)]);
  const caN1 = useQuery(Q.caN1, TX, [...scope, between(F.tx.date, winN1.start, winN1.end)]);
  const typo = useQuery(Q.typology, TX, [
    ...scope, between(F.tx.date, win.start, win.end),
    { field: F.tx.type, operator: 'equals', value: ['order'] },
  ]);
  const gam = useQuery(Q.gammes, OL, [...scopeOl, between(F.ol.date, win.start, win.end)]);
  const gamN1 = useQuery(Q.gammesN1, OL, [...scopeOl, between(F.ol.date, winN1.start, winN1.end)]);

  const shelf = (rows, field, shelves) => sum(rows, field, (r) => shelves.includes(r[F.ol.shelf]));
  const split = (rows, field) => {
    const all = sum(rows, field);
    const skin = shelf(rows, field, SKIN_SHELVES);
    return { all, skin, deo: minus(all, skin), sun: shelf(rows, field, [SUN_SHELF]) };
  };
  const inv = split(gam.data, F.ol.invoiced);
  const tot = split(gam.data, F.ol.total);
  const invN1 = split(gamN1.data, F.ol.invoiced);
  const totN1 = split(gamN1.data, F.ol.total);

  const objCa = obj.flow(F.hq.ca);
  const objSkin = obj.flow(F.hq.caSkin);
  // Déo and SUN have no turnover objective (A_VALIDER 1.7).
  const gammes = [
    { key: 'deo', name: 'Déo', dot: 'deo', cells: [
      { value: inv.deo, obj: null, prev: invN1.deo },
      { value: tot.deo, obj: null, prev: totN1.deo },
    ] },
    { key: 'skin', name: 'Skin*', dot: 'skin', cells: [
      { value: inv.skin, obj: objSkin, prev: invN1.skin },
      { value: tot.skin, obj: objSkin, prev: totN1.skin },
    ] },
    { key: 'sun', name: 'dont SUN', dot: 'sun', sub: true, cells: [
      { value: inv.sun, obj: null, prev: invN1.sun },
      { value: tot.sun, obj: null, prev: totN1.sun },
    ] },
    // Transactions are the source of truth: what the order lines cannot assign to a gamme closes the gap.
    // No n-1 variation: a percentage of a negative amount reads backwards.
    { key: 'unassigned', name: 'Avoirs non affectés', dot: 'other', cells: [
      { value: minus(first(ca, F.tx.invoiced), inv.all), obj: null, prev: null },
      { value: minus(first(ca, F.tx.total), tot.all), obj: null, prev: null },
    ] },
  ];
  const GAMME_ROWS = { all: ['deo', 'skin', 'sun', 'unassigned'], skin: ['skin', 'sun'], deo: ['deo'] };

  // Global cards: transactions for every gamme, order lines once a gamme is selected (A_VALIDER 1.10).
  const global = {
    all: { real: first(ca, F.tx.invoiced), total: first(ca, F.tx.total), obj: objCa,
      realPrev: first(caN1, F.tx.invoiced), totalPrev: first(caN1, F.tx.total) },
    skin: { real: inv.skin, total: tot.skin, obj: objSkin, realPrev: invN1.skin, totalPrev: totN1.skin },
    deo: { real: inv.deo, total: tot.deo, obj: null, realPrev: invN1.deo, totalPrev: totN1.deo },
  }[gamme];

  const typoRow = (name, value, caObj, nbObj, aovObj) => {
    const r = (typo.data || []).find((row) => row[F.tx.split] === value);
    // No order of a typology in the period is a zero, not a missing value.
    const real = n(r?.[F.tx.total]) ?? 0;
    const orders = n(r?.[F.tx.orders]) ?? 0;
    const ordersObj = obj.flow(nbObj);
    const objTurnover = obj.flow(caObj);
    return { name, real, obj: objTurnover, orders, ordersObj,
      aov: ratio(real, orders), aovObj: obj.aov(aovObj) };
  };

  return {
    ...status(ca, caN1, typo, gam, gamN1, obj.res, obj.aovRes),
    lineage: { ca: ca.lineage, gammes: gam.lineage, typology: typo.lineage, objectives: obj.res.lineage },
    data: {
      ...global,
      skinShare: gamme === 'all' ? share(inv.skin, inv.all) : null,
      skinShareObj: gamme === 'all' ? share(objSkin, objCa) : null,
      gammes: gammes.filter((g) => GAMME_ROWS[gamme].includes(g.key)),
      typology: [
        typoRow('Réassorts', SPLIT.repeat, F.hq.caRepeat, F.hq.nbRepeat, F.hq.aovRepeat),
        typoRow('Temps forts', SPLIT.preorders, F.hq.caPreorders, F.hq.nbPreorders, F.hq.aovPreorders),
        typoRow('Implantations', SPLIT.opening, F.hq.caOpening, F.hq.nbOpening, F.hq.aovOpening),
      ],
    },
  };
}

function usePark(view, obj) {
  const { win, winN1 } = view;
  const scope = scopeFilters(F.hi, view);
  const park = useQuery(Q.park, HI, [...scope, onDay(F.hi.day, win.asOf)]);
  const parkN1 = useQuery(Q.parkN1, HI, [...scope, onDay(F.hi.day, winN1.asOf)]);
  const teams = useQuery(Q.parkTeams, HI, [...scope, onDay(F.hi.day, win.asOf)]);
  const team = (t) => sum(teams.data, F.hi.active, (r) => r[F.hi.team] === t) ?? 0;

  const totalObj = obj.level(F.hq.active);
  const skinObj = obj.level(F.hq.activeSkin);
  return {
    ...status(park, parkN1, teams, obj.res),
    lineage: { park: park.lineage, teams: teams.lineage, objectives: obj.res.lineage },
    data: {
      asOf: win.asOf,
      total: first(park, F.hi.active), totalObj, totalPrev: first(parkN1, F.hi.active),
      // No objective of active déo pharmacies (A_VALIDER 1.8).
      deo: first(park, F.hi.deo), deoObj: null, deoPrev: first(parkN1, F.hi.deo),
      skin: first(park, F.hi.skin), skinObj, skinPrev: first(parkN1, F.hi.skin),
      skinShareObj: share(skinObj, totalObj),
      terrain: team(TEAM.terrain), terrainObj: obj.level(F.hq.active, obj.isTeam(TEAM.terrain)),
      is: team(TEAM.is), isObj: obj.level(F.hq.active, obj.isTeam(TEAM.is)),
    },
  };
}

function useDoors(view, obj) {
  const { win, winN1 } = view;
  const scope = scopeFilters(F.cu, view);
  // Each door count reads its own date, like the tile targets of pharma-hq-dash.
  const opened = between(F.cu.openingDate, win.start, win.end);
  const op = useQuery(Q.openings, CU, [...scope, opened]);
  const opN1 = useQuery(Q.openingsN1, CU, [...scope, between(F.cu.openingDate, winN1.start, winN1.end)]);
  const teams = useQuery(Q.openingsTeams, CU, [...scope, opened]);
  const inv = useQuery(Q.invoicedOpenings, CU, [...scope, between(F.cu.invoicedDate, win.start, win.end)]);
  const skin = useQuery(Q.skinDoors, CU, [...scope, between(F.cu.skinDate, win.start, win.end)]);
  const team = (field, t) => sum(teams.data, field, (r) => r[F.cu.team] === t) ?? 0;
  const objTeam = (field, t) => obj.flow(field, obj.isTeam(t));

  return {
    ...status(op, opN1, teams, inv, skin, obj.res),
    lineage: { openings: op.lineage, teams: teams.lineage, skin: skin.lineage, objectives: obj.res.lineage },
    data: {
      total: first(op, F.cu.openings), totalObj: obj.flow(F.hq.nbOpening), totalPrev: first(opN1, F.cu.openings),
      invoiced: first(inv, F.cu.invoiced),
      terrain: team(F.cu.openings, TEAM.terrain), terrainObj: objTeam(F.hq.nbOpening, TEAM.terrain),
      is: team(F.cu.openings, TEAM.is), isObj: objTeam(F.hq.nbOpening, TEAM.is),
      skin: first(skin, F.cu.skin), skinObj: obj.flow(F.hq.skinDoors),
      skinOpenings: first(op, F.cu.skinOpenings), skinOpeningsObj: obj.flow(F.hq.skinOpenings),
      skinConversions: first(skin, F.cu.conversions), skinConversionsObj: obj.flow(F.hq.conversions),
      deo: first(op, F.cu.deo), deoObj: obj.flow(F.hq.deoOpenings),
      deoTerrain: team(F.cu.deo, TEAM.terrain), deoTerrainObj: objTeam(F.hq.deoOpenings, TEAM.terrain),
      deoIs: team(F.cu.deo, TEAM.is), deoIsObj: objTeam(F.hq.deoOpenings, TEAM.is),
    },
  };
}

export function useSynthese(view) {
  const obj = useObjectives(view);
  return { ca: useCa(view, obj), parc: usePark(view, obj), doors: useDoors(view, obj) };
}
