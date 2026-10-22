// Attainment, status and fr-FR number formats shared by every rd- component.
// Rules come from docs/synthese-sales/design-system/README.md.

const NNBSP = ' ';
const MINUS = '−';

export const STATUS_TITLE = { ok: 'Atteint', warn: 'En cours', bad: 'En retard', neutral: 'Sans statut' };

const ok = (v) => v != null && Number.isFinite(Number(v));

// Attainment in % (0-100 scale), unrounded. Lower-is-better KPIs (delays) use obj / real.
export function attain(real, obj, { lowerIsBetter = false } = {}) {
  if (!ok(real) || !ok(obj) || Number(obj) === 0) return null;
  if (lowerIsBetter) return Number(real) === 0 ? null : (Number(obj) / Number(real)) * 100;
  return (Number(real) / Number(obj)) * 100;
}

// Thresholds apply to the unrounded value: 99.6 stays 'warn'.
export function status(pct) {
  if (!ok(pct)) return null;
  if (pct >= 100) return 'ok';
  if (pct >= 70) return 'warn';
  return 'bad';
}

const nf = (digits) => new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: digits, maximumFractionDigits: digits,
});
const NF0 = nf(0);
const NF1 = nf(1);
const NF2 = nf(2);
// Older ICU builds group with U+00A0 or a plain space; the design system wants U+202F.
const thin = (s) => s.replace(/[\s ]/g, NNBSP).replace('-', MINUS);

export const int = (v) => (ok(v) ? thin(NF0.format(Number(v))) : '—');
export const flow = (v) => (ok(v) ? (Number(v) > 0 ? '+' : '') + int(v) : '—');
export const eur = (v) => (ok(v) ? `${int(v)}${NNBSP}€` : '—');

// ≥ 1 M → 2,66 M€ · ≥ 10 k → 152 k€ · else 768 €.
export function eurCompact(v) {
  if (!ok(v)) return '—';
  const n = Number(v);
  const a = Math.abs(n);
  if (a >= 1e6) return `${thin(NF2.format(n / 1e6))}${NNBSP}M€`;
  if (a >= 1e4) return `${thin(NF0.format(n / 1e3))}${NNBSP}k€`;
  return eur(n);
}

// Takes a 0-100 value: 81 → "81 %", digits=1 → "40,0 %".
export const pct = (v, digits = 0) =>
  (ok(v) ? `${thin((digits ? (digits === 1 ? NF1 : NF2) : NF0).format(Number(v)))}${NNBSP}%` : '—');

export const FORMATS = { eur, eurCompact, int, flow, pct };

// Evolution vs n-1, null when n-1 is missing or zero (the delta is then hidden).
export function delta(cur, prev) {
  if (!ok(cur) || !ok(prev) || Number(prev) === 0) return null;
  const d = ((Number(cur) - Number(prev)) / Math.abs(Number(prev))) * 100;
  const r = Math.round(d);
  if (r === 0) return { dir: 'flat', text: `= 0${NNBSP}%` };
  return r > 0
    ? { dir: 'up', text: `▲ +${int(r)}${NNBSP}%` }
    : { dir: 'down', text: `▼ ${MINUS}${int(-r)}${NNBSP}%` };
}

// ProgressBar scale: top = max(real + pending, obj); returns the CSS vars of rd-bar.
export function barVars(real, obj, pending = 0) {
  const r = ok(real) ? Math.max(Number(real), 0) : 0;
  const p = ok(pending) ? Math.max(Number(pending), 0) : 0;
  const o = ok(obj) ? Number(obj) : null;
  const top = Math.max(r + p, o ?? 0);
  const s = (v) => (top > 0 ? ((v / top) * 100).toFixed(1) : '0.0');
  return { '--fill': s(r), '--obj': o == null ? '0.0' : s(o), '--pend': s(p) };
}
