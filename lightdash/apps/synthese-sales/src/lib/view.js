// View state (page + filter bar) kept in the URL so a link reopens the same view.
// URL values are user-editable: every read is checked against the allowed values.
import { useCallback, useMemo } from 'react';
import { useUrlState } from '@lightdash/query-sdk';
import { GRAINS, defaultPeriod, periodOptions, periodWindow, previousYear } from './period';

export const PAGES = [
  { v: 'synthese', l: 'Synthèse', title: 'Synthèse' },
  { v: 'reassort', l: 'Réassort', title: 'Pilotage & performance des réassorts', sub: 'Réassorts uniquement — les temps forts ont leurs propres pages' },
  { v: 'tf-encours', l: 'TF en cours & à venir', title: 'Temps forts en cours et à venir', sub: 'DN et packs vendus des TF ouverts et des précommandes' },
  { v: 'tf-passes', l: 'TF passés', title: 'Temps forts passés', sub: 'Historique des TF clôturés — analyses et atterrissages' },
  { v: 'distribution', l: 'Distribution & Assortiment', title: 'Distribution & assortiment', sub: 'DN par gamme, innovations, perfect assortment et performance SKU' },
];

export const CANALS = [
  { v: 'all', l: 'Terrain + IS' },
  { v: 'terrain', l: 'Terrain' },
  { v: 'is', l: 'IS' },
];

export const GAMMES = [
  { v: 'all', l: 'Skin + Déo' },
  { v: 'skin', l: 'Skin' },
  { v: 'deo', l: 'Déo' },
];

// Values of categ_decile_skin (checked in BigQuery on 2026-10-22): 1 to 10, plus Leclerc, N/A and P.
export const DECILES = [
  ...Array.from({ length: 10 }, (_, i) => ({ v: `${i + 1}`, l: `D${i + 1}` })),
  { v: 'Leclerc', l: 'Leclerc' },
  { v: 'N/A', l: 'N/A' },
  { v: 'P', l: 'P' },
];

const pick = (list, v, fallback) => (list.some((o) => o.v === v) ? v : fallback);

export function useView() {
  const [rawPage, setPage] = useUrlState('page', 'synthese');
  const [rawCanal, setCanal] = useUrlState('canal', 'all');
  const [rawGamme, setGamme] = useUrlState('gamme', 'all');
  const [rawDeciles, setDeciles] = useUrlState('deciles', []);
  const [rawGrain, setGrainRaw] = useUrlState('grain', 'ytd');
  const [rawPeriod, setPeriod] = useUrlState('period', null);

  const page = pick(PAGES, rawPage, 'synthese');
  const canal = pick(CANALS, rawCanal, 'all');
  const gamme = pick(GAMMES, rawGamme, 'all');
  const deciles = Array.isArray(rawDeciles)
    ? rawDeciles.filter((d) => DECILES.some((o) => o.v === d))
    : [];
  const grain = pick(GRAINS.filter((g) => !g.disabled), rawGrain, 'ytd');
  const options = useMemo(() => periodOptions(grain), [grain]);
  const period = options.some((o) => o.key === rawPeriod) ? rawPeriod : defaultPeriod(grain);

  // Switching granularity resets the period to the current one of the new grain.
  const setGrain = useCallback((g) => {
    setGrainRaw(g);
    setPeriod(defaultPeriod(g));
  }, [setGrainRaw, setPeriod]);

  const win = useMemo(() => periodWindow(grain, period), [grain, period]);
  const winN1 = useMemo(() => previousYear(win), [win]);

  return {
    page, setPage, canal, setCanal, gamme, setGamme, deciles, setDeciles,
    grain, setGrain, period, setPeriod, periodOptions: options, win, winN1,
  };
}
