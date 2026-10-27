import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TFCard } from './TFCard';

// Five cards per row; the row slides (scroll, trackpad or arrows) to reach the next TF.
export function TFSlider({ tfs, lineage }) {
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
