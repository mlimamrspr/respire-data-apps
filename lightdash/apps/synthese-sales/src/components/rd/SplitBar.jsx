import { pct } from '../../lib/kpi';

// skin and objSkin on a 0-100 scale; Déo is the complement (base: CA Réel).
export function SplitBar({ skin, objSkin }) {
  if (skin == null || !Number.isFinite(skin)) return null;
  const deo = 100 - skin;
  const hasObj = objSkin != null && Number.isFinite(objSkin);
  return (
    <>
      <div
        className="rd-split"
        role="img"
        aria-label={`Skin ${pct(skin)} du CA${hasObj ? `, objectif ${pct(objSkin)}` : ''}`}
      >
        <div className="rd-split__seg rd-split__seg--deo" style={{ width: `${deo.toFixed(1)}%` }} />
        <div className="rd-split__seg rd-split__seg--skin" style={{ width: `${skin.toFixed(1)}%` }} />
        {hasObj && <div className="rd-split__obj" style={{ left: `calc(${(100 - objSkin).toFixed(1)}% - 1px)` }} />}
      </div>
      <div className="rd-split__labels">
        <span><span className="rd-dot rd-dot--deo" />Déo {pct(deo)}</span>
        <span><span className="rd-dot rd-dot--skin" />Skin* {pct(skin)}{hasObj && ` · obj ${pct(objSkin)}`}</span>
      </div>
    </>
  );
}
