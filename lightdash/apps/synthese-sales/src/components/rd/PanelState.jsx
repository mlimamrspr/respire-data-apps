import { Loader2 } from 'lucide-react';

// Panel body while its queries run or after one fails: the panel title stays in place.
export function PanelState({ loading, error, children }) {
  if (loading) {
    return (
      <div className="rd-state" role="status">
        <Loader2 className="rd-spin" size={22} aria-hidden="true" />
        <span>Chargement…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rd-state rd-state--error" role="alert">
        <b>Requête en erreur</b>
        <span>{error.message || String(error)}</span>
      </div>
    );
  }
  return children;
}
