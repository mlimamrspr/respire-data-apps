import clsx from 'clsx';

// foot: list of rule lines; every * in a label must be defined there.
// Always visible, kept compact (see app.css) so the page still fits the screen.
export function Panel({ id, title, focus = false, foot, children, ...rest }) {
  return (
    <section className={clsx('rd-panel', focus && 'rd-panel--focus')} aria-labelledby={id} {...rest}>
      <h2 className="rd-panel__title" id={id}>{title}</h2>
      {children}
      {foot?.length > 0 && (
        <footer className="rd-panel__foot">
          {foot.map((f, i) => <span key={i}>{f}</span>)}
        </footer>
      )}
    </section>
  );
}

export function Block({ title, small, children }) {
  return (
    <div className="rd-panel__block">
      <h3 className="rd-panel__blocktitle">{title}{small && <small>{small}</small>}</h3>
      {children}
    </div>
  );
}
