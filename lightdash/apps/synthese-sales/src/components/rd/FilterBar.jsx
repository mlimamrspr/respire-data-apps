import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GRAINS } from '../../lib/period';
import { CANALS, DECILES, GAMMES } from '../../lib/view';
import { StatusLegend } from './StatusPill';

const Caret = () => <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3h8L5 8z" /></svg>;

// rd-select trigger; the list itself is a shadcn menu restyled by .rd-menu (styles/app.css).
function Select({ label, value, children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rd-select" type="button">{label} : <b>{value}</b><Caret /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rd-menu" align="start">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

function RadioSelect({ label, options, value, onChange }) {
  const current = options.find((o) => o.v === value);
  return (
    <Select label={label} value={current?.l ?? '—'}>
      <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
        {options.map((o) => <DropdownMenuRadioItem key={o.v} value={o.v}>{o.l}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </Select>
  );
}

const decileLabel = (ds) => (ds.length === 0 ? 'Tous' : ds.length <= 3 ? ds.join(', ') : `${ds.length} déciles`);

// Keeps the menu open so several deciles can be ticked in one go.
const stay = (e) => e.preventDefault();

function DecileSelect({ value, onChange }) {
  const toggle = (d) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);
  return (
    <Select label="Décile" value={decileLabel(value)}>
      <DropdownMenuCheckboxItem checked={value.length === 0} onCheckedChange={() => onChange([])} onSelect={stay}>
        Tous
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      {DECILES.map((d) => (
        <DropdownMenuCheckboxItem key={d.v} checked={value.includes(d.v)} onCheckedChange={() => toggle(d.v)} onSelect={stay}>
          {d.l}
        </DropdownMenuCheckboxItem>
      ))}
    </Select>
  );
}

// hideGamme: TF pages drop the Gamme filter, a TF already carries its range (spec 0).
export function FilterBar({ view, hideGamme = false }) {
  const periods = view.periodOptions.map((p) => ({ v: p.key, l: p.label }));
  return (
    <div className="rd-filters" role="toolbar" aria-label="Filtres">
      <RadioSelect label="Canal" options={CANALS} value={view.canal} onChange={view.setCanal} />
      <DecileSelect value={view.deciles} onChange={view.setDeciles} />
      {!hideGamme && <RadioSelect label="Gamme" options={GAMMES} value={view.gamme} onChange={view.setGamme} />}
      <StatusLegend />
      <span className="rd-filters__spacer" />
      <div className="rd-seg" role="group" aria-label="Granularité de période">
        {GRAINS.map((g) => (
          <button
            key={g.v}
            type="button"
            aria-pressed={view.grain === g.v}
            disabled={g.disabled}
            title={g.why}
            onClick={() => view.setGrain(g.v)}
          >
            {g.l}
          </button>
        ))}
      </div>
      <RadioSelect label="Période" options={periods} value={view.period} onChange={view.setPeriod} />
    </div>
  );
}
