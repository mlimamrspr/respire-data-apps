import { useRef } from 'react';
import { useDeliveryRender } from '@lightdash/query-sdk';
import './styles/tokens.css';
import './styles/bundle.css';
import './styles/app.css';
import { FilterBar, PageHead, TabNav } from './components/rd';
import { PAGES, useView } from './lib/view';
import { hasPharmacyGap } from './lib/model';
import { SynthesePage } from './pages/SynthesePage';
import { ReassortPage } from './pages/ReassortPage';
import { TFLivePage } from './pages/TFLivePage';
import { TFPastPage } from './pages/TFPastPage';
import { ComingSoon } from './pages/ComingSoon';

// A TF carries its own range; the Réassort queries have no gamme (transactions, current skin status).
const NO_GAMME_PAGES = ['reassort', 'tf-encours', 'tf-passes'];
// TF passés shows the landing of closed TF: its Année selector replaces the period controls.
const PERIOD_OFF = { 'tf-passes': 'Page pilotée par le sélecteur Année : un TF clôturé s’affiche à son atterrissage' };
const BUILT_PAGES = { synthese: SynthesePage, reassort: ReassortPage, 'tf-encours': TFLivePage, 'tf-passes': TFPastPage };

// Limits of the semantic layer that the active filters run into, stated rather than hidden.
function Notice({ view }) {
  const lines = [];
  if (view.deciles.length) {
    lines.push(<><b>Décile</b> : les objectifs ne sont pas déclinés par décile, ils s’affichent « Obj n.d. ».</>);
  }
  if (view.canal !== 'all' && ['tf-encours', 'tf-passes'].includes(view.page)) {
    lines.push(<><b>Canal</b> : les objectifs des TF sont nationaux, tous canaux confondus, ils s’affichent « Obj n.d. ».</>);
  }
  if (view.win && !view.win.wholeMonths && !PERIOD_OFF[view.page]) {
    lines.push(<><b>Fenêtre libre</b> : elle coupe un mois, les objectifs mensuels s’affichent « Obj n.d. ».</>);
  }
  if (view.page === 'reassort' && !hasPharmacyGap(view.grain)) {
    lines.push(<><b>Jours entre réassorts</b> : sur un cycle ou une fenêtre libre, moyenne simple des écarts (la moyenne par pharmacie n’existe qu’au mois, au trimestre et à l’année).</>);
  }
  if (view.gamme !== 'all' && view.page === 'synthese') {
    lines.push(<><b>Gamme</b> : ne s’applique qu’au bloc CA (hors typologie) ; parc et nouvelles portes restent toutes gammes [à valider].</>);
  }
  if (!lines.length) return null;
  return <div className="rd-notice">{lines.map((l, i) => <span key={i}>{l}</span>)}</div>;
}

export default function App() {
  const view = useView();
  const deliveryRender = useDeliveryRender();
  const page = PAGES.find((p) => p.v === view.page);
  // Pages already opened stay mounted, hidden, on the view they last showed: coming back with the
  // same filters re-runs no query, and a hidden page never queries for filters it does not show.
  const opened = useRef({});
  if (BUILT_PAGES[view.page] && (view.win || PERIOD_OFF[view.page])) opened.current[view.page] = view;
  const viewOf = (key) => (view.page === key || deliveryRender ? view : opened.current[key]);

  return (
    <div className="rd-shell">
      <div className="rd-page" data-screenshot-bounds>
        <TabNav pages={PAGES} current={view.page} onChange={view.setPage} />
        <FilterBar view={view} hideGamme={NO_GAMME_PAGES.includes(view.page)} periodOff={PERIOD_OFF[view.page]} />
        <PageHead title={page.title} sub={page.sub} />
        <Notice view={view} />
        {/* A cycle has no window until its bounds load; TF passés has its own window. */}
        {!view.win && !PERIOD_OFF[view.page] && (
          <div className="rd-state">{view.periodError ? 'Bornes des cycles indisponibles.' : 'Chargement des cycles…'}</div>
        )}
        {/* A capture render mounts every data-bearing page; only the active one is shown. */}
        {Object.entries(BUILT_PAGES).map(([key, Page]) => {
          const v = viewOf(key);
          return v && (v.win || PERIOD_OFF[key]) && (
            <div key={key} hidden={view.page !== key}>
              <Page view={v} />
            </div>
          );
        })}
        {!BUILT_PAGES[view.page] && <ComingSoon page={page} />}
      </div>
    </div>
  );
}
