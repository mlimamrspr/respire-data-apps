import { Download } from 'lucide-react';
import { useUrlState } from '@lightdash/query-sdk';
import {
  attain, eur, eurCompact, int,
} from '../lib/kpi';
import { useTFPast } from './useTFPast';
import {
  ColumnChart, deltaN1, KpiCard, Obj, Panel, PanelState, ProgressBar, RadioSelect, StatusPill, TFSlider,
} from '../components/rd';

const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const dates = (t) => `${DAY.format(new Date(t.start))} → ${DAY.format(new Date(t.end))}`;

function LandingPanel({ state }) {
  const { tfs } = state.data;
  return (
    <Panel
      id="t-tfp"
      title="Atterrissage par temps fort"
      foot={[
        <><b>Atterrissage</b> = DN, packs et CA facturé all-time du TF, sans filtre de date · <b>TF clôturés depuis 2026</b>, rattachés à l’année de leur début · valeurs recalculées, factures et précommandes tardives comprises · <b>Premium</b> inclut Sunrise, <b>Élite</b> inclut VIP+, comme Looker · TF sans objectif : « Obj n.d. »</>,
      ]}
    >
      <PanelState {...state}>
        {tfs.length
          ? <TFSlider tfs={tfs} lineage={state.lineage.campaigns} />
          : <div className="rd-state">Aucun temps fort clôturé sur cette année.</div>}
      </PanelState>
    </Panel>
  );
}

function BilledPanel({ state }) {
  const { billed, byTf } = state.data;
  return (
    <Panel
      id="t-tfb"
      title="Temps forts facturés sur l’année"
      foot={[
        <><b>Année</b> = YTD de l’année choisie (jusqu’à la fin du mois en cours), n-1 = même fenêtre un an plus tôt · <b>CA TF</b> = réel + en cours des commandes de typologie TF (implantations exclues), date de référence, comme la ligne Temps forts de la Synthèse en YTD · <b>AOV TF</b> = CA TF / nb de commandes TF ({int(billed.orders)}) · les TF en cours y contribuent aussi · pas d’objectif de CA par TF [à valider]</>,
      ]}
    >
      <PanelState {...state}>
        <div className="rd-tfpacks">
          <KpiCard
            {...state.lineage.billed}
            label="AOV des TF (panier moyen)"
            value={eur(billed.aov)}
            pct={attain(billed.aov, billed.aovObj)}
            meta={[<Obj value={billed.aovObj} fmt={eur} />, deltaN1(billed.aov, billed.aovN1)]}
          >
            <ProgressBar real={billed.aov} obj={billed.aovObj} />
          </KpiCard>
          <KpiCard
            {...state.lineage.billed}
            label="CA total TF"
            value={<span className="rd-tip" data-tip={eur(billed.total)} tabIndex={0}>{eurCompact(billed.total)}</span>}
            pct={attain(billed.total, billed.totalObj)}
            meta={[<Obj value={billed.totalObj} fmt={eurCompact} />, deltaN1(billed.total, billed.totalN1)]}
          >
            <ProgressBar real={billed.total} obj={billed.totalObj} />
          </KpiCard>
          <div className="rd-card" {...state.lineage.byTf}>
            <div className="rd-panel__titlebar">
              <h3 className="rd-panel__blocktitle">CA par TF<small>année, TF clôturés et en cours</small></h3>
            </div>
            <ColumnChart
              height={64}
              fmt={eurCompact}
              items={byTf.map((t) => ({ key: t.tag, name: t.name, real: t.ca, obj: null, meta: 'Obj n.d.' }))}
            />
          </div>
        </div>
      </PanelState>
    </Panel>
  );
}

// The table joins three queries: the CSV is built from the rows on screen.
const CSV_HEAD = ['Temps fort', 'Début', 'Fin', 'DN finale', 'Obj DN', 'Packs', 'Obj packs', 'CA facturé', 'CA par pack'];
function downloadCsv(tfs, year) {
  const cell = (v) => (v == null ? '' : /[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const rows = tfs.map((t) => [t.name, t.start, t.end, t.dn, t.dnObj, t.packs, t.packsObj,
    Math.round(t.ca), t.caPerPack == null ? null : Math.round(t.caPerPack)]);
  const csv = [CSV_HEAD, ...rows].map((r) => r.map(cell).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `historique-tf-${year}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

const Ratio = ({ real, obj, fmt = int }) => (
  <>
    {fmt(real)} <span className="muted">/ {obj == null ? 'n.d.' : fmt(obj)}</span>
  </>
);

function HistoryPanel({ state, year }) {
  const { tfs } = state.data;
  return (
    <Panel
      id="t-tfh"
      title="Historique des TF"
      foot={[
        <><b>Atterrissage</b>, comme les cartes · <b>CA par pack</b> = CA facturé / packs, n.d. sans pack (compositions non codées : TF 2024–2025, Solaire skin 2026, F13) · export CSV des lignes affichées</>,
      ]}
    >
      <PanelState {...state}>
        <div className="rd-panel__toolbar">
          <button type="button" className="rd-select" onClick={() => downloadCsv(tfs, year)} disabled={!tfs.length}>
            <Download size={14} aria-hidden="true" /> Export CSV
          </button>
        </div>
        <div className="rd-table-wrap" {...state.lineage.campaigns}>
          <table className="rd-table" aria-label="Historique des temps forts clôturés">
            <thead>
              <tr>
                <th>Temps fort</th><th>Dates</th>
                <th className="num">DN finale</th><th>Atteinte</th>
                <th className="num">Packs</th><th>Atteinte</th>
                <th className="num">CA facturé</th>
                <th className="num">CA / pack</th>
              </tr>
            </thead>
            <tbody>
              {tfs.map((t) => (
                <tr key={t.tag}>
                  <td className="strong">{t.name}</td>
                  <td className="muted">{dates(t)}</td>
                  <td className="num"><Ratio real={t.dn} obj={t.dnObj} /></td>
                  <td><StatusPill pct={attain(t.dn, t.dnObj)} sm suffix={false} /></td>
                  <td className="num"><Ratio real={t.packs} obj={t.packsObj} /></td>
                  <td><StatusPill pct={attain(t.packs, t.packsObj)} sm suffix={false} /></td>
                  <td className="num">{eur(t.ca)}</td>
                  <td className="num">{t.caPerPack == null ? 'n.d.' : eur(t.caPerPack)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelState>
    </Panel>
  );
}

export function TFPastPage({ view }) {
  const [rawYear, setYear] = useUrlState('tfYear', null);
  const state = useTFPast(view, rawYear);
  const { year, years } = state.data;
  return (
    <div className="rd-stack">
      {/* Drives the whole page: the period controls of the filter bar are off here. */}
      <div className="rd-panel__toolbar rd-pagebar">
        <RadioSelect label="Année" options={(years.length ? years : [year]).map((y) => ({ v: y, l: y }))} value={year} onChange={setYear} />
      </div>
      <LandingPanel state={state} />
      <BilledPanel state={state} />
      <HistoryPanel state={state} year={year} />
    </div>
  );
}
