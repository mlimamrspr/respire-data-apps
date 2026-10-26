import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { attain, int } from '../lib/kpi';
import { useTFLive } from './useTFLive';
import {
  ColumnChart, KpiCard, Obj, Panel, PanelState, ProgressBar, TFCard,
} from '../components/rd';

const tfCount = (list) => `${list.length} TF`;

// Five cards per row; the row slides (scroll, trackpad or arrows) to reach the next TF.
function TFSlider({ tfs, lineage }) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  }, []);
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update, tfs.length]);
  const slide = (dir) => {
    const el = ref.current;
    const card = el?.firstElementChild;
    if (card) el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 8) });
  };
  return (
    <div className="rd-tfslider">
      <button type="button" className="rd-tfslider__nav rd-tfslider__nav--prev" aria-label="Temps forts précédents" disabled={edges.start} onClick={() => slide(-1)}>
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      <div ref={ref} className="rd-tfgrid rd-tfgrid--scroll" onScroll={update} {...lineage}>
        {tfs.map((tf) => <TFCard key={tf.tag} tf={tf} />)}
      </div>
      <button type="button" className="rd-tfslider__nav rd-tfslider__nav--next" aria-label="Temps forts suivants" disabled={edges.end} onClick={() => slide(1)}>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function TrackingPanel({ state }) {
  const { tfs } = state.data;
  return (
    <Panel
      id="t-tfl"
      title="Suivi par temps fort"
      foot={[
        <><b>DN all-time</b> = pharmacies (CIP) ayant précommandé le TF · <b>DN sur la période</b> = précommandes datées dans la période, même obj [à valider] · <b>Packs</b> = 1<sup>re</sup> précommande dans la période, brouillons compris, comme Looker · <b>Élite</b> inclut VIP+ et Sunrise [à valider]</>,
        <><b>Dates estimées</b> : début = livraison médiane, fin = dernière précommande + 30 j [à valider] · <b>TF sans objectif masqués</b> (Octobre Rose 2026) · Hydrate et Purify + Hydrate séparés, Looker les regroupe · <b>À venir</b> = % de l’obj final, sans statut [à valider]</>,
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
    >
      <PanelState {...state}>
        <div className="rd-tfpacks">
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
              {...state.lineage.stateObj}
              label="Précommandes — TF à venir"
              value={int(upcoming.packs)}
              pct={attain(upcoming.packs, upcoming.obj)}
              neutral
              meta={[<span>Obj final {upcoming.obj == null ? 'n.d.' : int(upcoming.obj)}</span>, <span>{tfCount(upcoming.tfs)}</span>]}
            >
              <ProgressBar real={upcoming.packs} obj={upcoming.obj} />
            </KpiCard>
          <div className="rd-card" {...state.lineage.packs}>
            <div className="rd-panel__titlebar">
              <h3 className="rd-panel__blocktitle">Packs vendus vs objectif par TF<small>tous niveaux, packs de la période · obj = somme des obj des TF</small></h3>
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
