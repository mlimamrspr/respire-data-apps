// Terrain and Inside Sales tabs are out of scope (spec 0): they stay on their existing dashboards.
export function TabNav({ pages, current, onChange }) {
  return (
    <nav className="rd-tabs" aria-label="Pages du dashboard">
      {pages.map((p) => (
        <a
          key={p.v}
          href={`#${p.v}`}
          aria-current={p.v === current ? 'page' : undefined}
          onClick={(e) => { e.preventDefault(); onChange(p.v); }}
        >
          {p.l}
        </a>
      ))}
    </nav>
  );
}

export function PageHead({ title, sub }) {
  return <h1 className="rd-pagehead">{title}{sub && <small>{sub}</small>}</h1>;
}
