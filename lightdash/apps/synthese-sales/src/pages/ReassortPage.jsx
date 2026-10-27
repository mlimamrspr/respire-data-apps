import { useState } from 'react';
import { attain, eur, eurCompact, int } from '../lib/kpi';
import { hasPharmacyGap } from '../lib/model';
import { useReassort } from './useReassort';
import {
  deltaN1, KpiCard, Obj, Panel, PanelState, ProgressBar, StatusPill,
} from '../components/rd';

// No delay objective yet (A_VALIDER 2.3): every delay reads "Obj n.d." and carries no pill.
const OBJ_DELAY = null;
const LOWER = { lowerIsBetter: true };
const SEGMENTS = [{ v: 'skin', l: 'Skin' }, { v: 'deo', l: 'Déo' }];

const days = (v) => (v == null ? '—' : `${int(v)} j`);
const pharmacies = (v) => `${int(v)} pharmacie${Number(v) > 1 ? 's' : ''}`;
const Days = ({ value }) => (value == null ? '—' : <>{int(value)}<span className="rd-value__unit">jours</span></>);
const decileLabel = (d) => (/^\d+$/.test(d.v) ? `Décile ${d.v}` : d.l);

function DecileTable({ rows, view, lineage }) {
  // A click sets the Décile filter of the view on that row; a second click clears it.
  const toggle = (v) => {
    const only = view.deciles.length === 1 && view.deciles[0] === v;
    view.setDeciles(only ? [] : [v]);
  };
  return (
    <div className="rd-table-wrap" {...lineage}>
      <table className="rd-table rd-table--click" aria-label="Jours entre réassorts par décile">
        <thead>
          <tr>
            <th>Décile</th>
            <th className="num">Pharmas réassortées</th>
            <th className="num">Jours moy.</th>
            <th className="num">Atteinte</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pct = attain(r.days, OBJ_DELAY, LOWER);
            return (
              <tr
                key={r.v}
                tabIndex={0}
                aria-selected={view.deciles.includes(r.v)}
                onClick={() => toggle(r.v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(r.v);
                  }
                }}
              >
                <td>{decileLabel(r)}</td>
                <td className="num">{int(r.pharmacies)}</td>
                <td className="num">{days(r.days)}</td>
                <td className="num">{pct == null ? <span className="muted">—</span> : <StatusPill pct={pct} sm suffix={false} />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DelaysPanel({ state, view }) {
  const d = state.data;
  const [segment, setSegment] = useState('skin');
  const segmentSplit = (skin, deo) => [
    { dot: 'skin', label: 'Pharma Skin', value: days(skin), pct: attain(skin, OBJ_DELAY, LOWER) },
    { dot: 'deo', label: 'Pharma Déo', value: days(deo), pct: attain(deo, OBJ_DELAY, LOWER) },
  ];
  return (
    <Panel
      id="t-freq"
      title="Fréquence & délais de réassort"
      foot={[
        <><b>Jours entre réassorts</b> = moyenne, par pharmacie, des écarts entre deux réassorts consécutifs sur la période (mois, trimestre ou année), puis moyenne des pharmacies · <b>moy. simple</b> = moyenne de tous les écarts, seule valeur sur un cycle ou une fenêtre libre [à valider]</>,
        <><b>Délai implantation → 1<sup>er</sup> réassort</b> = date du 1<sup>er</sup> réassort − date d’implantation, rattaché à la date du 1<sup>er</sup> réassort, pharmacies dont la 1<sup>re</sup> commande est une implantation [à valider]</>,
        <><b>Pharma Skin / Déo</b> = statut skin actuel de la pharmacie [à valider] · <b>Plus bas = mieux</b> : atteinte = obj / réel, objectifs de délai à définir</>,
      ]}
    >
      <PanelState {...state}>
        <KpiCard
          {...state.lineage.delays}
          label="Nb de jours moyen entre deux réassorts"
          value={<Days value={d.gap} />}
          size="xl"
          pct={attain(d.gap, OBJ_DELAY, LOWER)}
          meta={[
            <Obj value={OBJ_DELAY} fmt={days} />,
            <span>plus bas = mieux</span>,
            hasPharmacyGap(view.grain) ? <span>moy. simple {days(d.gapSimple)}</span> : <span>moyenne simple</span>,
            <span>{pharmacies(d.pharmacies)}</span>,
          ]}
          breakdown={segmentSplit(d.gapSkin, d.gapDeo)}
        />
        <KpiCard
          label={<>Délai moyen entre l’implantation et le 1<sup>er</sup> réassort</>}
          value={<Days value={d.delay} />}
          size="xl"
          pct={attain(d.delay, OBJ_DELAY, LOWER)}
          meta={[
            <Obj value={OBJ_DELAY} fmt={days} />,
            <span>plus bas = mieux</span>,
            <span>{pharmacies(d.delayCount)}</span>,
          ]}
          breakdown={segmentSplit(d.delaySkin, d.delayDeo)}
        />
        <div className="rd-panel__block">
          <div className="rd-panel__titlebar">
            <h3 className="rd-panel__blocktitle">Jours entre réassorts par décile<small>clic sur une ligne = filtre Décile</small></h3>
            <div className="rd-seg" role="group" aria-label="Segment pharmacie">
              {SEGMENTS.map((s) => (
                <button key={s.v} type="button" aria-pressed={segment === s.v} onClick={() => setSegment(s.v)}>{s.l}</button>
              ))}
            </div>
          </div>
          <DecileTable rows={d.deciles[segment]} view={view} lineage={state.lineage.deciles} />
        </div>
      </PanelState>
    </Panel>
  );
}

function VolumePanel({ state, canal }) {
  const v = state.data;
  return (
    <Panel
      id="t-vol"
      {...state.lineage.objectives}
      title="Volumétrie & panier moyen (AOV) réassort"
      foot={[
        <><b>Réassort</b> = commande d’une pharmacie hors implantation et hors précommande de temps fort, brouillons compris [à valider]</>,
        <><b>AOV</b> = CA réassort / nb de réassorts, obj = moyenne des AOV saisis · <b>Pharma Skin / Déo</b> = statut skin actuel de la pharmacie</>,
        <><b>CA</b> = réel + en cours, comme la Synthèse [à valider] · <b>Déo / Skin*</b> = lignes de commande, comme le bloc CA par gamme · <b>*</b> Skin = skin + sun</>,
      ]}
    >
      <PanelState {...state}>
        <KpiCard
          {...state.lineage.repeat}
          label="Nombre de réassorts sur la période"
          value={int(v.orders)}
          size="xl"
          pct={attain(v.orders, v.ordersObj)}
          meta={[<Obj value={v.ordersObj} fmt={int} />, deltaN1(v.orders, v.ordersPrev)]}
          breakdown={[
            canal !== 'is' && { dot: 'terrain', label: 'Terrain', value: int(v.terrain), pct: attain(v.terrain, v.terrainObj) },
            canal !== 'terrain' && { dot: 'is', label: 'Inside Sales', value: int(v.is), pct: attain(v.is, v.isObj) },
          ]}
        >
          <ProgressBar real={v.orders} obj={v.ordersObj} />
        </KpiCard>
        <KpiCard
          {...state.lineage.segments}
          label="AOV réassort (panier moyen)"
          value={eur(v.aov)}
          size="xl"
          pct={attain(v.aov, v.aovObj)}
          meta={[<Obj value={v.aovObj} fmt={eur} />, deltaN1(v.aov, v.aovPrev)]}
          breakdown={[
            { dot: 'skin', label: 'AOV Pharma Skin', value: eur(v.aovSkin) },
            { dot: 'deo', label: 'AOV Pharma Déo', value: eur(v.aovDeo) },
          ]}
        >
          <ProgressBar real={v.aov} obj={v.aovObj} />
        </KpiCard>
        <KpiCard
          {...state.lineage.shelves}
          label="CA réassort total (réel + en cours)"
          value={eurCompact(v.ca)}
          size="xl"
          pct={attain(v.ca, v.caObj)}
          meta={[
            <Obj value={v.caObj} fmt={eurCompact} />,
            deltaN1(v.ca, v.caPrev),
            <span>dont facturé {eurCompact(v.caInvoiced)}</span>,
          ]}
          breakdown={[
            { dot: 'deo', label: 'Déo', value: eurCompact(v.caDeo) },
            { dot: 'skin', label: 'Skin*', value: eurCompact(v.caSkin) },
          ]}
        >
          <ProgressBar
            real={v.caInvoiced}
            obj={v.caObj}
            pending={v.ca == null || v.caInvoiced == null ? 0 : v.ca - v.caInvoiced}
          />
        </KpiCard>
      </PanelState>
    </Panel>
  );
}

export function ReassortPage({ view }) {
  const { delays, volume } = useReassort(view);
  return (
    <div className="rd-layout-2">
      <DelaysPanel state={delays} view={view} />
      <VolumePanel state={volume} canal={view.canal} />
    </div>
  );
}
