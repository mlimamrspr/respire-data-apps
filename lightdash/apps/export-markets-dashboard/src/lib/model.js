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
export const PAL = ['#7162FF', '#1F9E8F', '#E4645A', '#F2B138', '#5C7CFA', '#9B6BD6'];
export const C = { ink:'#1A1B22', mid:'#66687A', faint:'#9A9CAB', grid:'#EDEEF2',
                   line:'#E4E5EA', bg:'#F7F8FA', soft:'#F1EFFF' };

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
