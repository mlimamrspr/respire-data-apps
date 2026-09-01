export const S = 'dtm_d2c_spend_it_esp';
export const O = 'dtm_d2c_orders_it_esp';
export const P = 'dtm_d2c_product_sales_it_esp';

export const F = {
  day: `${S}.dt_day`, country: `${S}.country`, source: `${S}.source_spend`,
  spend: `${S}.total_amt_spend_eur`,
  impressions: `${S}.total_qty_impressions`, clicks: `${S}.total_qty_clicks`,
  conversions: `${S}.total_qty_conversions`, attRevenue: `${S}.total_amt_conversion_value_eur`,
  infOrders: `${S}.total_qty_influence_orders`, infNew: `${S}.total_qty_influence_new_customers`,
  infRevenue: `${S}.total_amt_bt_influence_revenue_eur`,
  revenue: `${O}.total_amt_bt_revenue_eur`, orders: `${O}.nb_distinct_orders`,
  newCust: `${O}.nb_distinct_new_customers`,
  pDay: `${P}.dt_day`, pCountry: `${P}.agg_country_shipping`, pRange: `${P}.categ_range_product`,
  pSku: `${P}.sku`, pName: `${P}.name_product`, pRayon: `${P}.rayon_product`,
  pUnits: `${P}.total_qty_items`, pRevenue: `${P}.total_amt_bt_product_revenue_eur`,
};

// One form for everything: dot notation. The SDK qualifies a bare name with the query's own
// explore, which double-prefixes a field coming from a JOINED table — and it keys the result
// rows with the exact string it was handed (qualifiedToShort in apiTransport). So the id used
// to ASK for a field and the id used to READ it back must be identical, and the dotted form is
// the only one that survives both.
// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY — change the font for the whole app here, nowhere else.
// The sandbox blocks external stylesheets and font CDNs (Google Fonts included), so a
// webfont cannot be loaded: only fonts already on the viewer's machine will render. The
// stack below is deliberately system-only, which is why it never needs a network request.
// ─────────────────────────────────────────────────────────────────────────────
export const TYPE = {
  family: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  // Figures are set with tabular numerals so columns of numbers line up when they change.
  numeric: 'tabular-nums',
  // The size scale actually in use, smallest to largest. Kept here as documentation: the
  // JSX writes them as Tailwind arbitrary values (text-[12px]) because Tailwind cannot read
  // a runtime constant. If you change one, change every occurrence of that same size.
  size: {
    legend: 11,    // chart legends, KPI deltas
    label: 11.5,   // KPI labels, axis-adjacent captions
    body: 12,      // table cells, popover text, chips
    lead: 12.5,    // page subtitle, popover titles
    tile: 13,      // tile titles, tab labels
    page: 17,      // page title
    figure: 26,    // KPI value
  },
};

// Respire theme. Every hue below is one of the 20 brand colours; the only additions are
// alpha variants of the ink and the accent, used for text hierarchy and fills — the palette
// has no greys, and a chart with no tonal range is unreadable.
export const T = {
  sand:   '#f2ebe7', ink:    '#18140f', black:  '#000000', gold:   '#e1b85c',
  olive:  '#5e5800', brick:  '#8b3625', lime:   '#b7c86c', forest: '#2d641b',
  brown:  '#804400', mint:   '#81d496', pine:   '#00684e', moss:   '#655500',
  turq:   '#4dd7c6', teal:   '#00646f', leaf:   '#3b6209', cyan:   '#4ed0f0',
  navy:   '#005c8f', green:  '#006944', sky:    '#80c3ff', indigo: '#3e4e97',
  white: '#ffffff'
};

// Categorical series order, picked for separation rather than for the order they were given.
export const PAL = [T.indigo, T.pine, T.brick, T.gold, T.navy, T.brown, T.turq, T.lime];

export const C = {
  bg: T.sand, surface: T.white, ink: T.ink,
  mid:   'rgba(24,20,15,.68)',
  faint: 'rgba(24,20,15,.46)',
  line:  'rgba(24,20,15,.15)',
  grid:  'rgba(24,20,15,.09)',
  accent: T.indigo,
  soft:  'rgba(62,78,151,.13)',
  softer:'rgba(62,78,151,.07)',
  // A raw, noisy series sits behind its rolling line and must not compete with it.
  muted: 'rgba(24,20,15,.30)',
  onGold: T.brown,
  // Single-hue scale for a share column. A range, never a red/green rule: a large share is
  // not a verdict, and the palette carries no "bad" colour on purpose.
  scale: (t) => `rgba(62,78,151,${Math.min(0.85, t).toFixed(2)})`,
};

// Ratios are derived here, never queried. Re-deriving from additive components at the
// displayed grain is the only way a ratio stays correct when days are rolled into weeks:
// averaging seven daily COS values would weight a quiet Sunday like a heavy Tuesday.
export function derive(b) {
  const r = { ...b };
  r.cos = b.revenue ? b.spend / b.revenue : null;
  r.cac = b.newCust ? b.spend / b.newCust : null;
  r.cpo = b.orders ? b.spend / b.orders : null;
  r.aov = b.orders ? b.revenue / b.orders : null;
  r.cpm = b.impressions ? (b.spendMeta * 1000) / b.impressions : null;
  r.cpc = b.clicks ? b.spendMeta / b.clicks : null;
  r.cpa = b.conversions ? b.spendMeta / b.conversions : null;
  r.roas = b.spendMeta ? b.attRevenue / b.spendMeta : null;
  return r;
}

export const ADD = ['spend','spendMeta','spendInf','revenue','orders','newCust','impressions',
                    'clicks','conversions','attRevenue','infOrders','infNew','infRevenue'];

export const blank = () => Object.fromEntries(ADD.map(k => [k, 0]));

export function keyOf(iso, grain) {
  const d = new Date(iso + 'T00:00:00Z');
  if (grain === 'week') { const n = new Date(d); n.setUTCDate(n.getUTCDate() - ((n.getUTCDay() + 6) % 7)); return n.toISOString().slice(0,10); }
  if (grain === 'month') return iso.slice(0,7) + '-01';
  return iso;
}
const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function labelOf(iso, grain) {
  const d = new Date(iso + 'T00:00:00Z');
  if (grain === 'month') return M[d.getUTCMonth()] + " '" + String(d.getUTCFullYear()).slice(2);
  return d.getUTCDate() + ' ' + M[d.getUTCMonth()];
}

// A rolling window over ratios cannot be a mean of ratios. Averaging seven daily COS values
// weights a quiet Sunday like a heavy Tuesday; the honest figure is the COS of the whole week,
// which means summing the components first and dividing once — exactly what derive() does at
// the period level. So: sum the additive columns across the window, derive the ratios from
// that sum, and only then replace the additive columns with their per-period mean.
export function rollingWindows(rows, k) {
  return rows.map((_, i) => {
    const win = rows.slice(Math.max(0, i - k + 1), i + 1);
    const sum = blank();
    win.forEach(r => ADD.forEach(a => { sum[a] += r[a] || 0; }));
    const out = derive(sum);              // ratios: true value over the whole window
    ADD.forEach(a => { out[a] = sum[a] / win.length; });  // additive: mean per period
    out.n = win.length;
    return out;
  });
}

export function rolling(vals, k) {
  return vals.map((_, i) => {
    const s = vals.slice(Math.max(0, i - k + 1), i + 1).filter(v => v != null && isFinite(v));
    return s.length ? s.reduce((a,b) => a + b, 0) / s.length : null;
  });
}

export const eur = (v, d = 0) => (v == null || !isFinite(v)) ? '—'
  : '€' + v.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
export const int = (v) => (v == null || !isFinite(v)) ? '—' : Math.round(v).toLocaleString('en-GB');
export const pct = (v, d = 0) => (v == null || !isFinite(v)) ? '—' : (v * 100).toFixed(d) + '%';
export const mult = (v) => (v == null || !isFinite(v)) ? '—' : v.toFixed(2) + '×';
export function fmt(v, kind) {
  if (kind === 'eur') return eur(v, 0);
  if (kind === 'eur2') return eur(v, 2);
  if (kind === 'pct') return pct(v, 0);
  if (kind === 'x') return mult(v);
  return int(v);
}
export const abbr = (v) => {
  const a = Math.abs(v || 0);
  if (a >= 1e6) return (v/1e6).toFixed(1) + 'M';
  if (a >= 1e3) return (v/1e3).toFixed(a >= 1e4 ? 0 : 1) + 'k';
  if (a >= 10) return v.toFixed(0);
  return (v || 0).toFixed(a >= 1 ? 1 : 2);
};
export const signPct = (a, b) => (a == null || b == null || !b || !isFinite(a) || !isFinite(b)) ? null : (a - b) / Math.abs(b);
export const deltaTxt = (p) => p == null ? '—' : (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p * 100).toFixed(0) + '%';
