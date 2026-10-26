import { attain, eur, eurCompact, flow, int, pct } from '../lib/kpi';
import { useSynthese } from './useSynthese';
import {
  Block, deltaN1, GammeMatrix, KpiCard, Obj, Panel, PanelState, ProgressBar, SplitBar, TypologyBars,
} from '../components/rd';

const GAMME_SCOPE = { all: 'toutes gammes', skin: 'Skin* · lignes de commande', deo: 'Déo · lignes de commande' };
const frDate = (iso) => iso.split('-').reverse().join('/');

const share = (part, whole) => (part == null || !whole ? null : (part / whole) * 100);

// Channel cards: when Canal = Terrain or IS the other card would read 0, so it is hidden
// and the selected one goes full width (spec 1).
function ChannelPair({ canal, terrain, is }) {
  if (canal === 'terrain') return terrain;
  if (canal === 'is') return is;
  return <div className="rd-grid-2">{terrain}{is}</div>;
}

function CaPanel({ state, gamme }) {
  const ca = state.data;
  return (
    <Panel
      id="t-ca"
      {...state.lineage.objectives}
      title="Chiffre d’Affaires (CA)"
      foot={[
        <><b>Réel</b> = CA facturé sur la période · <b>En cours</b> = commandes saisies non facturées [à valider]</>,
        <><b>*</b> Skin = skin + sun · <b>Déo</b> = CA hors skin · <b>AOV</b> = CA / nb de commandes, obj = moyenne des AOV saisis · <b>Nb cmds (obj)</b> entre parenthèses</>,
        <><b>Avoirs non affectés</b> = CA global − (Déo + Skin*) : avoirs sans commande (RFA, COOP, gestes commerciaux) et avoirs d’une commande hors période, que les lignes de commande ne rattachent à aucune gamme</>,
        <><b>Typologie</b> = CA réel + en cours des commandes, comme le dashboard actuel [à valider]</>,
      ]}
    >
      <PanelState {...state}>
      <Block title="Global" small={GAMME_SCOPE[gamme]}>
        <div className="rd-grid-3">
            <KpiCard
              {...state.lineage.ca}
              label="CA Réel"
              value={eur(ca.real)}
              pct={attain(ca.real, ca.obj)}
              meta={[<Obj value={ca.obj} fmt={eurCompact} />, deltaN1(ca.real, ca.realPrev)]}
            >
              <ProgressBar real={ca.real} obj={ca.obj} />
            </KpiCard>
            <KpiCard
              label="CA Réel + en cours"
              value={eur(ca.total)}
              pct={attain(ca.total, ca.obj)}
              meta={[<Obj value={ca.obj} fmt={eurCompact} />, deltaN1(ca.total, ca.totalPrev)]}
            >
              <ProgressBar real={ca.real} obj={ca.obj} pending={ca.total == null || ca.real == null ? 0 : ca.total - ca.real} />
            </KpiCard>
          {gamme === 'all' ? (
            <KpiCard
              {...state.lineage.gammes}
              label="Poids du Skin* dans le CA"
              value={pct(ca.skinShare)}
              pct={attain(ca.skinShare, ca.skinShareObj)}
              meta={[<Obj value={ca.skinShareObj} fmt={(v) => pct(v)} />, <span>base CA Réel</span>]}
            >
              <SplitBar skin={ca.skinShare} objSkin={ca.skinShareObj} />
            </KpiCard>
          ) : (
            <KpiCard label="Poids du Skin* dans le CA" value="—" meta={[<span>sans objet avec un filtre Gamme</span>]} />
          )}
        </div>
      </Block>
      <Block title="CA par gamme" small="Réel / Réel + en cours">
        <GammeMatrix rows={ca.gammes} {...state.lineage.gammes} />
      </Block>
      <Block title="Répartition par typologie" small="CA · Nb cmds · AOV vs obj">
        <TypologyBars rows={ca.typology} caLabel="CA réel + en cours vs obj" {...state.lineage.typology} />
      </Block>
      </PanelState>
    </Panel>
  );
}

function ParcPanel({ state, canal }) {
  const parc = state.data;
  const skinShare = share(parc.skin, parc.total);
  return (
    <Panel
      id="t-parc"
      {...state.lineage.objectives}
      title="Parc Actif"
      foot={[
        <><b>*</b> Actif = pharmacie ayant commandé dans les 9 derniers mois (glissants, à la date de fin de période, ou aujourd’hui pour une période en cours)</>,
        <><b>Pharma Déo</b> = active sans produit skin : Déo + Skin = total [à valider]</>,
        'Répartition : canal du compte au moment de la dernière commande [à valider]',
      ]}
    >
      <PanelState {...state}>
      <KpiCard
        {...state.lineage.park}
        label="Nb pharmacies actives* — total"
        value={int(parc.total)}
        size="xl"
        pct={attain(parc.total, parc.totalObj)}
        meta={[<Obj value={parc.totalObj} fmt={int} />, deltaN1(parc.total, parc.totalPrev), <span>au {frDate(parc.asOf)}</span>]}
      >
        <ProgressBar real={parc.total} obj={parc.totalObj} />
      </KpiCard>
      <div className="rd-grid-2">
        <KpiCard
          label="Pharma Déo actives*"
          dot="deo"
          value={int(parc.deo)}
          pct={attain(parc.deo, parc.deoObj)}
          meta={[<Obj value={parc.deoObj} fmt={int} />, deltaN1(parc.deo, parc.deoPrev)]}
        />
        <KpiCard
          label="Pharma Skin actives*"
          dot="skin"
          value={int(parc.skin)}
          pct={attain(parc.skin, parc.skinObj)}
          meta={[<Obj value={parc.skinObj} fmt={int} />, deltaN1(parc.skin, parc.skinPrev)]}
        />
      </div>
      <KpiCard
        label="% du parc actif en Skin*"
        value={pct(skinShare, 1)}
        pct={attain(skinShare, parc.skinShareObj)}
        meta={[<Obj value={parc.skinShareObj} fmt={(v) => pct(v)} />, <span>Pharma Skin / Pharma actives</span>]}
      >
        <ProgressBar real={skinShare} obj={parc.skinShareObj} series="skin" />
      </KpiCard>
      <Block title="Répartition équipe sales">
        <div {...state.lineage.teams}>
        <ChannelPair
          canal={canal}
          terrain={(
            <KpiCard
              label="Terrain"
              channel="terrain"
              value={int(parc.terrain)}
              pct={attain(parc.terrain, parc.terrainObj)}
              meta={[<Obj value={parc.terrainObj} fmt={int} />]}
            >
              <ProgressBar real={parc.terrain} obj={parc.terrainObj} series="terrain" />
            </KpiCard>
          )}
          is={(
            <KpiCard
              label="Inside Sales (IS)"
              channel="is"
              value={int(parc.is)}
              pct={attain(parc.is, parc.isObj)}
              meta={[<Obj value={parc.isObj} fmt={int} />]}
            >
              <ProgressBar real={parc.is} obj={parc.isObj} series="is" />
            </KpiCard>
          )}
        />
        </div>
      </Block>
      </PanelState>
    </Panel>
  );
}

function DoorsPanel({ state, canal }) {
  const doors = state.data;
  return (
    <Panel
      id="t-np"
      {...state.lineage.objectives}
      title="Nouvelles portes"
      focus
      foot={[
        <><b>Ouverture</b> = 1<sup>re</sup> commande d’une pharmacie sur la période · <b>Facturée</b> = ouverture avec ≥ 1 facture émise [à valider]</>,
        <><b>Ouverture skin</b> = nouvelle pharmacie entrant par le skin · <b>Conversion skin</b> = pharmacie déjà active déo passant sa 1<sup>re</sup> commande skin [à valider]</>,
      ]}
    >
      <PanelState {...state}>
      <KpiCard
        {...state.lineage.openings}
        label="Ouvertures totales"
        value={flow(doors.total)}
        size="xl"
        pct={attain(doors.total, doors.totalObj)}
        meta={[
          <Obj value={doors.totalObj} fmt={int} />,
          <span>dont <b style={{ color: 'var(--rd-ink)' }}>{int(doors.invoiced)}</b> facturées</span>,
          deltaN1(doors.total, doors.totalPrev),
        ]}
      >
        <ProgressBar real={doors.total} obj={doors.totalObj} />
      </KpiCard>
      <div {...state.lineage.teams}>
      <ChannelPair
        canal={canal}
        terrain={(
          <KpiCard
            label="Portes Terrain"
            channel="terrain"
            value={flow(doors.terrain)}
            pct={attain(doors.terrain, doors.terrainObj)}
            meta={[<Obj value={doors.terrainObj} fmt={int} />]}
          />
        )}
        is={(
          <KpiCard
            label="Portes Inside Sales"
            channel="is"
            value={flow(doors.is)}
            pct={attain(doors.is, doors.isObj)}
            meta={[<Obj value={doors.isObj} fmt={int} />]}
          />
        )}
      />
      </div>
      <KpiCard
        {...state.lineage.skin}
        label="Nouvelles portes Skin*"
        dot="skin"
        value={flow(doors.skin)}
        pct={attain(doors.skin, doors.skinObj)}
        meta={[<Obj value={doors.skinObj} fmt={int} />]}
        sub={[
          { value: flow(doors.skinOpenings), label: 'Ouvertures skin', pct: attain(doors.skinOpenings, doors.skinOpeningsObj) },
          { value: flow(doors.skinConversions), label: 'Conversions skin', pct: attain(doors.skinConversions, doors.skinConversionsObj) },
        ]}
      />
      <KpiCard
        label="Nouvelles portes Déo"
        dot="deo"
        value={flow(doors.deo)}
        pct={attain(doors.deo, doors.deoObj)}
        meta={[<Obj value={doors.deoObj} fmt={int} />]}
        sub={[
          canal !== 'is' && { value: flow(doors.deoTerrain), label: 'Terrain', pct: attain(doors.deoTerrain, doors.deoTerrainObj) },
          canal !== 'terrain' && { value: flow(doors.deoIs), label: 'Inside Sales', pct: attain(doors.deoIs, doors.deoIsObj) },
        ].filter(Boolean)}
      />
      </PanelState>
    </Panel>
  );
}

export function SynthesePage({ view }) {
  const { ca, parc, doors } = useSynthese(view);
  return (
    <div className="rd-page__cols">
      <CaPanel state={ca} gamme={view.gamme} />
      <ParcPanel state={parc} canal={view.canal} />
      <DoorsPanel state={doors} canal={view.canal} />
    </div>
  );
}
