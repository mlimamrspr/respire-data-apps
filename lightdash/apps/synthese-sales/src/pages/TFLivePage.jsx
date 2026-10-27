import { attain, eur, eurCompact, int } from '../lib/kpi';
import { useTFLive } from './useTFLive';
import {
  ColumnChart, KpiCard, Obj, Panel, PanelState, ProgressBar, TFSlider,
} from '../components/rd';

const tfCount = (list) => `${list.length} TF`;

function TrackingPanel({ state }) {
  const { tfs } = state.data;
  return (
    <Panel
      id="t-tfl"
      title="Suivi par temps fort"
      foot={[
        <><b>DN all-time</b> = pharmacies (CIP) ayant précommandé le TF · <b>DN sur la période</b> = précommandes datées dans la période, même obj [à valider] · <b>Packs</b> = 1<sup>re</sup> précommande dans la période, brouillons compris, comme Looker · <b>Élite</b> inclut VIP+, <b>Premium</b> inclut Sunrise, comme Looker</>,
        <><b>Dates estimées</b> : début = livraison médiane, fin = dernière précommande + 30 j [à valider] · <b>TF sans objectif masqués</b>, comme Looker · Hydrate et Purify + Hydrate séparés, Looker les regroupe · <b>À venir</b> = % de l’obj final, sans statut [à valider]</>,
      ]}
    >
      <PanelState {...state}>
        {tfs.length
          ? <TFSlider tfs={tfs} lineage={state.lineage.campaigns} />
          : <div className="rd-state">Aucun temps fort en cours ou à venir.</div>}
      </PanelState>
    </Panel>
  );
}

function PacksPanel({ state }) {
  const { live, upcoming, tfs } = state.data;
  return (
    <Panel
      id="t-tfa"
      title="Avancement des packs"
      foot={[
        <><b>Packs vendus</b> = tous niveaux, packs de la période · <b>Objectif</b> = somme des objectifs de packs des TF, chacun compté une fois · <b>CA</b> (cartes et TF) = réel + en cours des précommandes du TF passées dans la période (date de commande), comme Looker, sans objectif par TF [à valider]</>,
      ]}
    >
      <PanelState {...state}>
        <div className="rd-tfpacks">
          <div className="rd-tfpacks__col">
            <KpiCard
              {...state.lineage.statePacks}
              label="Packs vendus — TF en cours"
              value={int(live.packs)}
              pct={attain(live.packs, live.obj)}
              meta={[<Obj value={live.obj} fmt={int} />, <span>{live.tfs.map((t) => t.name).join(' + ') || 'aucun TF'}</span>]}
            >
              <ProgressBar real={live.packs} obj={live.obj} />
            </KpiCard>
            <KpiCard
              {...state.lineage.caLive}
              label="CA — TF en cours"
              value={<span className="rd-tip" data-tip={eur(live.ca)} tabIndex={0}>{eurCompact(live.ca)}</span>}
              size="md"
            />
          </div>
          <div className="rd-tfpacks__col">
            <KpiCard
              {...state.lineage.stateObj}
              label="Précommandes — TF à venir"
              value={int(upcoming.packs)}
              pct={attain(upcoming.packs, upcoming.obj)}
              neutral
              meta={[<span>Obj final {upcoming.obj == null ? 'n.d.' : int(upcoming.obj)}</span>, <span>{tfCount(upcoming.tfs)}</span>]}
            >
              <ProgressBar real={upcoming.packs} obj={upcoming.obj} />
            </KpiCard>
            <KpiCard
              {...state.lineage.caUpcoming}
              label="CA précommandé — TF à venir"
              value={<span className="rd-tip" data-tip={eur(upcoming.ca)} tabIndex={0}>{eurCompact(upcoming.ca)}</span>}
              size="md"
            />
          </div>
          <div className="rd-card" {...state.lineage.packs}>
            <div className="rd-panel__titlebar">
              <h3 className="rd-panel__blocktitle">Packs vendus vs objectif par TF<small>tous niveaux</small></h3>
              <div className="rd-chartlegend">
                <span><span className="rd-swatch" />Réalisé</span>
                <span><span className="rd-swatch rd-swatch--track" />Objectif</span>
                <span><span className="rd-swatch rd-swatch--tick" />Repère objectif</span>
              </div>
            </div>
            <ColumnChart
              height={64}
              items={tfs.map((t) => ({
                key: t.tag, name: t.name, real: t.packs, obj: t.packsObj,
                neutral: t.upcoming, meta: t.upcoming ? 'à venir' : 'en cours',
              }))}
            />
          </div>
        </div>
      </PanelState>
    </Panel>
  );
}

export function TFLivePage({ view }) {
  const state = useTFLive(view);
  return (
    <div className="rd-stack">
      <TrackingPanel state={state} />
      <PacksPanel state={state} />
    </div>
  );
}
