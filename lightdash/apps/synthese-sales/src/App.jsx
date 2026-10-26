import { useDeliveryRender } from '@lightdash/query-sdk';
import './styles/tokens.css';
import './styles/bundle.css';
import './styles/app.css';
import { FilterBar, PageHead, TabNav } from './components/rd';
import { PAGES, useView } from './lib/view';
import { SynthesePage } from './pages/SynthesePage';
import { ReassortPage } from './pages/ReassortPage';
import { TFLivePage } from './pages/TFLivePage';
import { ComingSoon } from './pages/ComingSoon';

// A TF carries its own range; the Réassort queries have no gamme (transactions, current skin status).
const NO_GAMME_PAGES = ['reassort', 'tf-encours', 'tf-passes'];
const BUILT_PAGES = { synthese: SynthesePage, reassort: ReassortPage, 'tf-encours': TFLivePage };

// Limits of the semantic layer that the active filters run into, stated rather than hidden.
function Notice({ view }) {
  const lines = [];
  if (view.deciles.length) {
    lines.push(<><b>Décile</b> : les objectifs ne sont pas déclinés par décile, ils s’affichent « Obj n.d. ».</>);
  }
  if (view.canal !== 'all' && view.page === 'tf-encours') {
    lines.push(<><b>Canal</b> : les objectifs des TF sont nationaux, tous canaux confondus, ils s’affichent « Obj n.d. ».</>);
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

  return (
    <div className="rd-shell">
      <div className="rd-page" data-screenshot-bounds>
        <TabNav pages={PAGES} current={view.page} onChange={view.setPage} />
        <FilterBar view={view} hideGamme={NO_GAMME_PAGES.includes(view.page)} />
        <PageHead title={page.title} sub={page.sub} />
        <Notice view={view} />
        {/* A capture render mounts every data-bearing page; only the active one is shown. */}
        {Object.entries(BUILT_PAGES).map(([key, Page]) => (view.page === key || deliveryRender) && (
          <div key={key} hidden={view.page !== key}>
            <Page view={view} />
          </div>
        ))}
        {!BUILT_PAGES[view.page] && <ComingSoon page={page} />}
      </div>
    </div>
  );
}
