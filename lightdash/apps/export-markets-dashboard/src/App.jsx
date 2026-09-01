// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT MARKETS DASHBOARD — Italy & Spain daily performance.
//
// WHERE TO CHANGE WHAT
//   Field ids ....... lib/model.js → F. Always dot notation (table.field), see the note there.
//   Colours / font .. lib/model.js → T, C, PAL, TYPE.
//   Tile shells ..... lib/ui.jsx → Card, TileHead, Kpi, Chip, Note.
//   A tab's content . the five tab components at the bottom of this file.
//   Queries ......... the q* constants just below, defined at module scope so the hook is not
//                     handed a new object on every render.
//   Ratios .......... lib/model.js → derive(). Never queried, always computed after roll-up.
// ═══════════════════════════════════════════════════════════════════════════════
import { useMemo, useState } from 'react';
import { query, useLightdash } from '@lightdash/query-sdk';
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Cell,
} from 'recharts';
import {
  S, P, F, PAL, C, TYPE, derive, ADD, blank, keyOf, labelOf, rollingWindows,
  eur, int, pct, fmt, abbr, signPct, deltaTxt,
} from './lib/model';
import { Card, TileHead, Kpi, Chip, Note, Empty, LEG } from './lib/ui';

const LIM = 5000;
// dt_day notNull is the "has paid media" guard. Orders exist from 2019 while paid media
// starts in April 2026; without it a single null-date bucket carries 1,626 orders and
// drags every rolling average with it.
const NOT_NULL = [{ field: F.day, operator: 'notNull' }];

const qDaily = query(S).label('Daily performance by market')
  .dimensions([F.day, F.country])
  .metrics([F.spend, F.revenue, F.orders, F.newCust, F.impressions, F.clicks,
            F.conversions, F.attRevenue])
  .filters(NOT_NULL).limit(LIM);

const qSource = query(S).label('Daily spend by source')
  .dimensions([F.day, F.country, F.source]).metrics([F.spend])
  .filters(NOT_NULL).limit(LIM);

const qInfluence = query(S).label('Influence return')
  .dimensions([F.country]).metrics([F.infOrders, F.infNew, F.infRevenue, F.spend])
  .filters([{ field: F.source, operator: 'equals', value: 'Influence' }]).limit(100);

const qRange = query(P).label('Units by product range')
  .dimensions([F.pDay, F.pCountry, F.pRange]).metrics([F.pUnits]).limit(LIM);

const qSku = query(P).label('Units and revenue by reference')
  .dimensions([F.pSku, F.pName, F.pRange, F.pCountry]).metrics([F.pUnits, F.pRevenue]).limit(LIM);

const TABS = [['overview','Overview'],['acq','Paid acquisition'],['profit','Profitability'],
              ['products','Products'],['detail','Detail']];
const GRAINS = [{v:'day',l:'Day'},{v:'week',l:'Week'},{v:'month',l:'Month'}];
const WINDOWS = [{v:30,l:'30 d'},{v:90,l:'90 d'},{v:365,l:'12 m'},{v:0,l:'All'}];
const MARKETS = [{v:'all',l:'Both'},{v:'Italy',l:'Italy'},{v:'Spain',l:'Spain'}];

export default function App() {
  const [tab, setTab] = useState('overview');
  const [grain, setGrain] = useState('day');
  const [win, setWin] = useState(90);
  const [market, setMarket] = useState('all');

  const daily = useLightdash(qDaily);
  const source = useLightdash(qSource);
  const influence = useLightdash(qInfluence);
  const ranges = useLightdash(qRange);
  const skus = useLightdash(qSku);

  const inMarket = (c) => market === 'all' || c === market;
  const spendMetaByDay = useMemo(() => {
    const m = {};
    (source.data || []).forEach(r => {
      if (!inMarket(r[F.country])) return;
      const k = r[F.day]; if (!k) return;
      m[k] = m[k] || { meta: 0, inf: 0 };
      if (r[F.source] === 'Meta') m[k].meta += r[F.spend] || 0;
      else m[k].inf += r[F.spend] || 0;
    });
    return m;
  }, [source.data, market]);

  // Roll days into the displayed grain by summing additive components, then derive the
  // ratios once at the end — see derive() for why this order is not interchangeable.
  const series = useMemo(() => {
    const idx = {}, out = [];
    (daily.data || []).forEach(r => {
      const iso = r[F.day]; if (!iso || !inMarket(r[F.country])) return;
      const k = keyOf(iso, grain);
      if (idx[k] === undefined) { idx[k] = out.length; out.push({ ...blank(), key: k, label: labelOf(k, grain) }); }
      const b = out[idx[k]];
      b.spend += r[F.spend] || 0; b.revenue += r[F.revenue] || 0;
      b.orders += r[F.orders] || 0; b.newCust += r[F.newCust] || 0;
      b.impressions += r[F.impressions] || 0; b.clicks += r[F.clicks] || 0;
      b.conversions += r[F.conversions] || 0; b.attRevenue += r[F.attRevenue] || 0;
      const sm = spendMetaByDay[iso];
      if (sm) { b.spendMeta += sm.meta; b.spendInf += sm.inf; }
    });
    out.sort((a, b) => a.key < b.key ? -1 : 1);
    const kept = win ? out.slice(-Math.ceil(win / (grain === 'day' ? 1 : grain === 'week' ? 7 : 30))) : out;
    const derived = kept.map(derive);
    const w7 = rollingWindows(derived, 7);
    const KEYS = ['spend','revenue','orders','cos','cac','cpo','cpm','cpc','cpa','roas',
                  'newCust','attRevenue'];
    return derived.map((d, i) => {
      const o = { ...d, n7: w7[i].n };
      KEYS.forEach(k => { o[k + '_7'] = w7[i][k]; });
      return o;
    });
  }, [daily.data, spendMetaByDay, grain, win, market]);

  const last = series[series.length - 1] || {};
  const prev = series[series.length - 2] || {};
  const unit = grain === 'day' ? 'day' : grain === 'week' ? 'week' : 'month';
  const loading = daily.loading || source.loading;
  const err = daily.error || source.error;

  const prodRows = useMemo(() => (ranges.data || []).filter(r => inMarket(r[F.pCountry])), [ranges.data, market]);
  const skuRows = useMemo(() => {
    const m = {};
    (skus.data || []).filter(r => inMarket(r[F.pCountry])).forEach(r => {
      const k = r[F.pSku];
      m[k] = m[k] || { sku: k, name: r[F.pName], range: r[F.pRange], units: 0, revenue: 0 };
      m[k].units += r[F.pUnits] || 0; m[k].revenue += r[F.pRevenue] || 0;
    });
    return Object.values(m).sort((a, b) => b.units - a.units);
  }, [skus.data, market]);

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink,
         fontFamily: TYPE.family }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: C.line, background: C.surface }}>
        <h1 className="text-[17px] font-semibold tracking-tight">Daily / Weekly Trackers  (IT &amp; ES)</h1>
        <p className="text-[12.5px] mt-0.5" style={{ color: C.mid }}>
          Daily performance for Italy and Spain. Paid media starts April 2026 — profitability
          metrics are blank before that date.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <Chip label="Market" options={MARKETS} value={market} onChange={setMarket} />
          <Chip label="Grain" options={GRAINS} value={grain} onChange={setGrain} />
          <Chip label="Window" options={WINDOWS} value={win} onChange={setWin} />
        </div>
        <div className="flex gap-1 mt-3">
          {TABS.map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className="px-3 py-1.5 text-[13px] rounded-md transition-colors"
              style={{ background: tab === v ? C.soft : 'transparent',
                       color: tab === v ? C.accent : C.mid, fontWeight: tab === v ? 600 : 400 }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {err && <Card className="p-4 text-[13px]" style={{ color: PAL[2] }}>Query failed: {String(err.message || err)}</Card>}
        {loading && <Card className="p-8"><Empty>Loading…</Empty></Card>}

        {!loading && !err && tab === 'overview' && (
          <Overview {...{ series, last, prev, unit, daily }} />
        )}
        {!loading && !err && tab === 'acq' && <Acq {...{ series, unit }} />}
        {!loading && !err && tab === 'profit' && <Profit {...{ series, unit, influence }} />}
        {!loading && !err && tab === 'products' && <Products {...{ prodRows, skuRows, grain, ranges }} />}
        {!loading && !err && tab === 'detail' && <Detail {...{ series, unit }} />}
      </div>
    </div>
  );
}


const RATIOS = ['cos','cac','cpo','cpm','cpc','cpa','roas','aov'];

// "over the last 7 days" is not checkable by the reader. Naming the actual boundaries is,
// and it is the only way to notice that a window is short because the data runs out.
const spanOf = (rows, endIdx, n) => {
  const from = Math.max(0, endIdx - n + 1);
  const slice = rows.slice(from, endIdx + 1);
  if (!slice.length) return null;
  const a = slice[0].label, b = slice[slice.length - 1].label;
  return { text: slice.length === 1 ? a : `${a} – ${b}`, n: slice.length };
};

const noteRaw = (l, unit, cur) => (
  <>The value for <b>{cur?.label ?? 'the most recent complete ' + unit}</b> alone, and the change
  against the {unit} before it. On these volumes — about 18 orders a day in Italy, 3 in Spain —
  a swing of ±40% between two consecutive {unit}s is ordinary and means nothing on its own.
  This tile says what happened; the rolling one next to it says what to act on.</>
);

const noteRoll = (l, unit, k, cur, prev) => (
  <>The mean of {l.toLowerCase()} over <b>{cur ? `${cur.text}` : `the last 7 ${unit}s`}</b>
  {cur && cur.n < 7 && <> — only {cur.n} {unit}{cur.n > 1 ? 's' : ''} of data, not a full window</>}.
  {' '}The change compares it with <b>{prev ? prev.text : `the 7 ${unit}s before that`}</b>, an
  adjacent window that does not overlap — so a move here needs several {unit}s to shift, not
  one outlier.
  {' '}No colour is applied: on a market being opened, a rise is not automatically bad and a
  fall is not automatically good — read it next to spend before concluding.
  {RATIOS.includes(k) && (
    <><br /><br /><b>How it is computed.</b> Not the mean of 7 daily ratios — that would weight a
    quiet {unit} like a heavy one. The components are summed across the window first, then
    divided once, so this is the true {l.toLowerCase()} over the whole span. It matches what the
    Full recap table shows in its total column for the same period.</>
  )}</>
);

// Shared recharts styling. AX is spread onto every axis, TT onto every tooltip — change an
// axis or tooltip look once here rather than on each chart.
const AX = { tick: { fontSize: 10, fill: C.faint }, axisLine: false, tickLine: false };
const TT = { contentStyle: { fontSize: 11, borderRadius: 6, border: `1px solid ${C.line}` } };

// CHART FRAME — wraps every recharts figure: header, legend, fixed height, responsive width.
// Change the frame here; change what is plotted inside each tab's component below.
function Chart({ title, note, legend, height = 230, children }) {
  return (
    <Card>
      <TileHead title={title} note={note} />
      {legend && <LEG items={legend} />}
      <div style={{ height }} className="px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </Card>
  );
}

const RECAP_N = [{v:7,l:'7'},{v:14,l:'14'},{v:30,l:'30'},{v:0,l:'All'}];

// ── TAB 1 · OVERVIEW ─────────────────────────────────────────────────────────
// Guidance block, then every headline twice (raw last period, then 7-period rolling), then
// four charts, then the full recap. PAIRS drives both KPI rows; RECAP drives the table rows.
function Overview({ series, last, prev, unit }) {
  const [recapN, setRecapN] = useState(7);
  const PAIRS = [
    { k: 'spend', l: 'Marketing spend', f: 'eur' },
    { k: 'revenue', l: 'Net revenue', f: 'eur' },
    { k: 'orders', l: 'Orders', f: 'int' },
    { k: 'cos', l: 'COS', f: 'pct' },
  ];
  const RECAP = [
    ['spend','Marketing spend','eur'],['revenue','Net revenue','eur'],
    ['attRevenue','Attributed revenue','eur'],['orders','Orders','int'],
    ['newCust','New customers','int'],['aov','Average order value','eur2'],
    ['cos','COS','pct'],['cac','CAC','eur2'],['cpo','Cost per order','eur2'],
    ['impressions','Impressions','int'],['clicks','Clicks','int'],
    ['conversions','Conversions','int'],['cpm','CPM','eur2'],['cpc','CPC','eur2'],
    ['cpa','Cost per conversion','eur2'],
  ];
  const cols = recapN ? series.slice(-recapN) : series;
  const total = derive(cols.reduce((a, b) => {
    ADD.forEach(k => { a[k] += b[k] || 0; }); return a;
  }, blank()));

  return (
    <>
      <Note title="Read this before you react to a number" items={[
        { b: '1', t: 'Volumes are small — Italy averages about 18 orders a day, Spain about 3. A single-period move of ±40% is ordinary. Every headline below is shown twice: the raw last period, and the 7-period rolling average beside it. Trust the rolling one.' },
        { b: '2', t: 'COS above 100% is expected. These markets are being opened, not harvested. There is a reference line at 100% on the COS chart and no red/green threshold anywhere.' },
        { b: '3', t: 'Two revenue measures exist. Net revenue is what was collected. Attributed revenue is what the ad platform claims (incl. VAT, broader window) and is structurally higher — it is never used in COS, CAC or cost per order.' },
      ]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PAIRS.map(m => (
          <Kpi key={m.k} label={`${m.l} · last ${unit}`} value={fmt(last[m.k], m.f)}
               sub={`Last ${unit} — ${last.label || ''}`} delta={deltaTxt(signPct(last[m.k], prev[m.k]))}
               note={noteRaw(m.l, unit, last)} />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PAIRS.map(m => {
          const a = last[m.k + '_7'], b = series[series.length - 8]?.[m.k + '_7'];
          return <Kpi key={m.k} label={`${m.l} · 7-${unit} avg`} value={fmt(a, m.f)}
                      sub={`7-${unit} rolling average`} delta={deltaTxt(signPct(a, b))} accent={PAL[0]}
                      note={noteRoll(m.l, unit, m.k, spanOf(series, series.length - 1, 7), spanOf(series, series.length - 8, 7))} />;
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Chart title="Marketing spend vs net revenue"
               note="One euro axis, so the gap between what goes out and what comes back is readable directly."
               legend={[{t:'Marketing spend',c:PAL[0]+'66',h:10},{t:'Net revenue',c:PAL[1]}]}>
          <ComposedChart data={series}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" {...AX} minTickGap={24} />
            <YAxis {...AX} tickFormatter={v => '€' + abbr(v)} width={48} />
            <Tooltip {...TT} formatter={(v, n) => [eur(v), n]} />
            <Bar dataKey="spend" fill={PAL[0] + '66'} name="Marketing spend" radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="revenue" stroke={PAL[1]} strokeWidth={2} dot={false} name="Net revenue" />
          </ComposedChart>
        </Chart>

        <Chart title="Orders"
               note="Raw bars behind the rolling line. The shape to read is the line — a single bar of 3 orders means very little."
               legend={[{t:`Orders per ${unit}`,c:C.softer,h:10},{t:`7-${unit} rolling avg`,c:PAL[0]}]}>
          <ComposedChart data={series}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" {...AX} minTickGap={24} />
            <YAxis {...AX} width={38} />
            <Tooltip {...TT} />
            <Bar dataKey="orders" fill={C.softer} name="Orders" radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="orders_7" stroke={PAL[0]} strokeWidth={2.2} dot={false} name="7-period avg" />
          </ComposedChart>
        </Chart>

        <Chart title="COS — cost of sale"
               note="Marketing spend ÷ net revenue. Above the line, media costs more than it returns this period — expected while a market is being opened."
               legend={[{t:`COS per ${unit}`,c:C.muted},{t:`7-${unit} rolling avg`,c:PAL[0]},{t:'Media break-even · 100%',c:PAL[3]}]}>
          <ComposedChart data={series}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" {...AX} minTickGap={24} />
            <YAxis {...AX} tickFormatter={v => (v*100).toFixed(0) + '%'} width={44} />
            <Tooltip {...TT} formatter={v => pct(v, 1)} />
            <ReferenceLine y={1} stroke={PAL[3]} strokeDasharray="5 4"
              label={{ value: 'Media break-even · 100%', position: 'insideTopLeft', fontSize: 10, fill: C.onGold }} />
            <Line type="monotone" dataKey="cos" stroke={C.muted} strokeWidth={1.2} dot={false} name="COS" />
            <Line type="monotone" dataKey="cos_7" stroke={PAL[0]} strokeWidth={2.2} dot={false} name="7-period avg" />
          </ComposedChart>
        </Chart>

        <Chart title="CAC and cost per order"
               note="Both in euros on one axis. The gap between the lines is the repeat-customer effect."
               legend={[{t:'CAC (new customers)',c:PAL[2]},{t:'Cost per order',c:PAL[1]}]}>
          <ComposedChart data={series}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" {...AX} minTickGap={24} />
            <YAxis {...AX} tickFormatter={v => '€' + abbr(v)} width={48} />
            <Tooltip {...TT} formatter={v => eur(v, 2)} />
            <Line type="monotone" dataKey="cac_7" stroke={PAL[2]} strokeWidth={2.2} dot={false} name="CAC" />
            <Line type="monotone" dataKey="cpo_7" stroke={PAL[1]} strokeWidth={2.2} dot={false} name="Cost per order" />
          </ComposedChart>
        </Chart>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3 pr-4">
          <TileHead
            title={`Full recap — every metric, ${recapN ? `last ${cols.length} ${unit}s` : `all ${cols.length} ${unit}s`}`}
            note={<>Metrics as rows, periods as columns. This is the tile that replaces the
              spreadsheet: the same definitions for both markets, in one place.
              {cols.length > 0 && <> Showing <b>{cols[0].label} – {cols[cols.length-1].label}</b>.</>}
              {' '}Ratios are re-derived from their components at each period, never averaged — which
              is why the total column is the true ratio over the whole span and not the mean of the
              columns beside it. The 7-period KPIs at the top of this tab use the same method, so a
              ratio there and the total column here agree when the spans match.</>} />
          <div className="pt-3 shrink-0">
            <Chip label="Periods" options={RECAP_N} value={recapN} onChange={setRecapN} />
          </div>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-left font-medium py-1.5 pr-3" style={{ color: C.faint }}>Metric</th>
                {cols.map(c => <th key={c.key} className="text-right font-medium py-1.5 px-2 whitespace-nowrap" style={{ color: C.faint }}>{c.label}</th>)}
                <th className="text-right font-medium py-1.5 pl-2" style={{ color: C.faint }}>Period total</th>
              </tr>
            </thead>
            <tbody>
              {RECAP.map(([k, l, f]) => (
                <tr key={k} style={{ borderTop: `1px solid ${C.grid}` }}>
                  <td className="py-1.5 pr-3 whitespace-nowrap" style={{ color: C.ink }}>{l}</td>
                  {cols.map(c => (
                    <td key={c.key} className="text-right py-1.5 px-2 whitespace-nowrap"
                        style={{ color: k === 'attRevenue' ? C.mid : C.ink, fontVariantNumeric: TYPE.numeric }}>
                      {fmt(c[k], f)}
                    </td>
                  ))}
                  <td className="text-right py-1.5 pl-2 font-semibold whitespace-nowrap"
                      style={{ background: C.softer, fontVariantNumeric: TYPE.numeric }}>{fmt(total[k], f)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ── TAB 2 · PAID ACQUISITION ─────────────────────────────────────────────────
// Unit costs only, all shown as rolling averages: a single period's CPM or CPC is far too
// noisy to display raw. Add or remove a KPI by editing the KPIS array.
function Acq({ series, unit }) {
  const KPIS = [['cpm','CPM','eur2'],['cpc','CPC','eur2'],['cpa','Cost per conversion','eur2'],['roas','Attributed ROAS','x']];
  const last = series[series.length - 1] || {}, back = series[series.length - 8] || {};
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map(([k, l, f]) => (
          <Kpi key={k} label={l} value={fmt(last[k + '_7'], f)} sub={`7-${unit} rolling average`}
               delta={deltaTxt(signPct(last[k + '_7'], back[k + '_7']))} accent={PAL[0]}
               note={noteRoll(l, unit, k, spanOf(series, series.length - 1, 7), spanOf(series, series.length - 8, 7))} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Chart title="Ad spend vs revenue returned"
               note="Attributed revenue is dashed to mark it as the platform's own claim, not collected cash. It includes VAT and a broader attribution window, and is never used in a ratio here."
               legend={[{t:'Ad spend',c:PAL[0]+'55',h:10},{t:'Net revenue',c:PAL[1]},{t:'Attributed revenue',c:PAL[3]}]} height={240}>
          <ComposedChart data={series}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" {...AX} minTickGap={24} />
            <YAxis {...AX} tickFormatter={v => '€' + abbr(v)} width={48} />
            <Tooltip {...TT} formatter={v => eur(v)} />
            <Bar dataKey="spendMeta" fill={PAL[0] + '55'} name="Ad spend" radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="revenue_7" stroke={PAL[1]} strokeWidth={2} dot={false} name="Net revenue" />
            <Line type="monotone" dataKey="attRevenue_7" stroke={PAL[3]} strokeWidth={2} strokeDasharray="5 3" dot={false} name="Attributed revenue" />
          </ComposedChart>
        </Chart>
        <Chart title="Cost per conversion"
               note="Two orders of magnitude above the cost per click, so it gets its own tile rather than a second axis."
               legend={[{t:`Per ${unit}`,c:C.muted},{t:`7-${unit} rolling avg`,c:PAL[3]}]} height={240}>
          <ComposedChart data={series}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" {...AX} minTickGap={24} />
            <YAxis {...AX} tickFormatter={v => '€' + abbr(v)} width={48} domain={[0, 'auto']} />
            <Tooltip {...TT} formatter={v => eur(v, 2)} />
            <Line type="monotone" dataKey="cpa" stroke={C.muted} strokeWidth={1.2} dot={false} name="Per period" />
            <Line type="monotone" dataKey="cpa_7" stroke={PAL[3]} strokeWidth={2.2} dot={false} name="7-period avg" />
          </ComposedChart>
        </Chart>
      </div>
    </>
  );
}

// ── TAB 3 · PROFITABILITY ────────────────────────────────────────────────────
// Ratios plus their denominators, so a move can be attributed to spend or to recruitment.
// The influencer block is a Note rather than a chart: it is a closed pilot, not a live series.
function Profit({ series, unit, influence }) {
  const KPIS = [['cos','COS','pct'],['cac','CAC','eur2'],['cpo','Cost per order','eur2'],['newCust','New customers','int']];
  const last = series[series.length - 1] || {}, back = series[series.length - 8] || {};
  const inf = (influence.data || []).reduce((a, r) => ({
    spend: a.spend + (r[F.spend] || 0), orders: a.orders + (r[F.infOrders] || 0),
    rev: a.rev + (r[F.infRevenue] || 0),
  }), { spend: 0, orders: 0, rev: 0 });
  const roas = inf.spend ? inf.rev / inf.spend : null;
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map(([k, l, f]) => (
          <Kpi key={k} label={l} value={fmt(last[k + '_7'], f)} sub={`7-${unit} rolling average`}
               delta={deltaTxt(signPct(last[k + '_7'], back[k + '_7']))} accent={PAL[0]}
               note={noteRoll(l, unit, k, spanOf(series, series.length - 1, 7), spanOf(series, series.length - 8, 7))} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Chart title="Spend by source"
               note="Paid ads and influence stacked. The two are identical on 98.5% of days — the amber band is the exception, not the rule."
               legend={[{t:'Paid ads',c:PAL[0]+'99',h:10},{t:'Influence',c:PAL[3],h:10}]} height={240}>
          <ComposedChart data={series}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" {...AX} minTickGap={24} />
            <YAxis {...AX} tickFormatter={v => '€' + abbr(v)} width={48} />
            <Tooltip {...TT} formatter={v => eur(v)} />
            <Bar dataKey="spendMeta" stackId="s" fill={PAL[0] + '99'} name="Paid ads" />
            <Bar dataKey="spendInf" stackId="s" fill={PAL[3]} name="Influence" radius={[2,2,0,0]} />
          </ComposedChart>
        </Chart>
        <Chart title="COS and CAC" note="A percentage and a euro amount, so two axes. COS on the left, CAC on the right."
               legend={[{t:'COS — left',c:PAL[0]},{t:'CAC — right',c:PAL[2]}]} height={240}>
          <ComposedChart data={series}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" {...AX} minTickGap={24} />
            <YAxis yAxisId="l" {...AX} tickFormatter={v => (v*100).toFixed(0)+'%'} width={44} />
            <YAxis yAxisId="r" orientation="right" {...AX} tickFormatter={v => '€'+abbr(v)} width={44} />
            <Tooltip {...TT} />
            <ReferenceLine yAxisId="l" y={1} stroke={C.muted} strokeDasharray="5 4" />
            <Line yAxisId="l" type="monotone" dataKey="cos_7" stroke={PAL[0]} strokeWidth={2.2} dot={false} name="COS" />
            <Line yAxisId="r" type="monotone" dataKey="cac_7" stroke={PAL[2]} strokeWidth={2.2} dot={false} name="CAC" />
          </ComposedChart>
        </Chart>
        <Chart title="Orders and new customers"
               note="Overlaid, not stacked: new customers are a subset of orders, not an addition to them. Stacking would double-count every first purchase."
               legend={[{t:'All orders',c:C.softer,h:10},{t:'New customers',c:PAL[0],h:10}]} height={240}>
          <ComposedChart data={series}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" {...AX} minTickGap={24} />
            <YAxis {...AX} width={38} />
            <Tooltip {...TT} />
            <Bar dataKey="orders" fill={C.softer} name="All orders" radius={[2,2,0,0]} />
            <Bar dataKey="newCust" fill={PAL[0]} name="New customers" radius={[2,2,0,0]} />
          </ComposedChart>
        </Chart>
        <Note title="Influencer pilot — paused" items={[
          { b: eur(inf.spend), t: 'spent with 2 creators. The campaign has not run since August 2026.' },
          { b: eur(inf.rev), t: `attributed revenue — ${roas ? '€' + roas.toFixed(2) : '—'} back per €1 invested, against €1.90 on the French market.` },
          { b: 'Note', t: 'Included in “All marketing” spend. The channel reports no impressions and no clicks at all, so no CPM or CPC exists for it — this is a limit of data entry in the influence app, not of the model.' },
        ]} />
      </div>
    </>
  );
}

// ── TAB 4 · PRODUCTS ─────────────────────────────────────────────────────────
// The only tab on the product explore. Grouping is always SKU + name together, never name
// alone: several references share one label and grouping by name would merge them.
function Products({ prodRows, skuRows, grain, ranges }) {
  const byRange = useMemo(() => {
    const m = {};
    prodRows.forEach(r => { const k = r[F.pRange] || '—'; m[k] = (m[k] || 0) + (r[F.pUnits] || 0); });
    return Object.entries(m).map(([range, units]) => ({ range, units })).sort((a, b) => b.units - a.units);
  }, [prodRows]);

  const overTime = useMemo(() => {
    const idx = {}, out = [], names = new Set();
    prodRows.forEach(r => {
      const iso = r[F.pDay]; if (!iso) return;
      const k = keyOf(iso, grain === 'day' ? 'week' : grain);
      if (idx[k] === undefined) { idx[k] = out.length; out.push({ key: k, label: labelOf(k, grain === 'day' ? 'week' : grain) }); }
      const n = r[F.pRange] || '—'; names.add(n);
      out[idx[k]][n] = (out[idx[k]][n] || 0) + (r[F.pUnits] || 0);
    });
    out.sort((a, b) => a.key < b.key ? -1 : 1);
    return { rows: out.slice(-26), names: [...names] };
  }, [prodRows, grain]);

  const top = skuRows.slice(0, 5);
  const grand = skuRows.reduce((a, r) => a + r.units, 0) || 1;
  if (ranges.loading) return <Card className="p-8"><Empty>Loading…</Empty></Card>;

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-4">
        <Chart title="Units sold by range" note="Whole selected window. Horizontal because range names are long." height={260}>
          <BarChart data={byRange} layout="vertical" margin={{ left: 8, right: 28 }}>
            <CartesianGrid stroke={C.grid} horizontal={false} />
            <XAxis type="number" {...AX} />
            <YAxis type="category" dataKey="range" {...AX} width={130} />
            <Tooltip {...TT} formatter={v => int(v)} />
            <Bar dataKey="units" fill={PAL[0]} radius={[0,3,3,0]} name="Units" />
          </BarChart>
        </Chart>
        <Chart title="Top 5 references" note="Grouped by SKU and product name together, never by name alone: several references share one label, and grouping by name would merge them and add up their quantities." height={260}>
          <BarChart data={top.map(r => ({ ...r, lab: r.sku }))} layout="vertical" margin={{ left: 8, right: 28 }}>
            <CartesianGrid stroke={C.grid} horizontal={false} />
            <XAxis type="number" {...AX} />
            <YAxis type="category" dataKey="lab" {...AX} width={130} />
            <Tooltip {...TT} formatter={(v, n, p) => [int(v), p.payload.name]} />
            <Bar dataKey="units" fill={PAL[5]} radius={[0,3,3,0]} name="Units" />
          </BarChart>
        </Chart>
      </div>

      <Chart title="Units by range over time"
             note={`Stacked by range, at ${grain === 'day' ? 'week' : grain} grain — at daily grain on an export market the bars are too thin to read.`}
             legend={overTime.names.map((n, i) => ({ t: n, c: PAL[i % PAL.length], h: 10 }))} height={250}>
        <ComposedChart data={overTime.rows}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="label" {...AX} minTickGap={20} />
          <YAxis {...AX} width={38} />
          <Tooltip {...TT} />
          {overTime.names.map((n, i) => (
            <Bar key={n} dataKey={n} stackId="u" fill={PAL[i % PAL.length]} name={n} />
          ))}
        </ComposedChart>
      </Chart>

      <Card>
        <TileHead title="Product detail"
          note="One wide sortable table rather than three more tiles. The share column is shaded on a single scale — a range, never a red/green rule, which would imply a verdict the data cannot support." />
        <div className="overflow-x-auto px-4 pb-4 max-h-[460px]">
          <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
            <thead className="sticky top-0" style={{ background: C.surface }}>
              <tr>
                {['Reference','Product','Range','Units','Share','Revenue BT'].map((h, i) => (
                  <th key={h} className={'py-1.5 font-medium ' + (i > 2 ? 'text-right pl-3' : 'text-left pr-3')}
                      style={{ color: C.faint }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skuRows.map(r => {
                const share = r.units / grand;
                return (
                  <tr key={r.sku} style={{ borderTop: `1px solid ${C.grid}` }}>
                    <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{r.sku}</td>
                    <td className="py-1.5 pr-3" style={{ color: C.mid }}>{r.name}</td>
                    <td className="py-1.5 pr-3" style={{ color: C.mid }}>{r.range}</td>
                    <td className="py-1.5 pl-3 text-right" style={{ fontVariantNumeric: TYPE.numeric }}>{int(r.units)}</td>
                    <td className="py-1.5 pl-3 text-right" style={{ background: C.scale(share * 2.4), fontVariantNumeric: TYPE.numeric }}>{pct(share, 1)}</td>
                    <td className="py-1.5 pl-3 text-right" style={{ color: C.mid, fontVariantNumeric: TYPE.numeric }}>{eur(r.revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ── TAB 5 · DETAIL ───────────────────────────────────────────────────────────
// Raw export table plus the definitions block. COLS drives the columns: add a metric to the
// array and it appears, formatted by its third element.
function Detail({ series, unit }) {
  const COLS = [
    ['label', unit, 'txt'], ['spend','Spend','eur'], ['spendMeta','Ads only','eur'],
    ['revenue','Net rev.','eur'], ['attRevenue','Attributed','eur'], ['orders','Orders','int'],
    ['newCust','New cust.','int'], ['aov','AOV','eur2'], ['cos','COS','pct'],
    ['cac','CAC','eur2'], ['impressions','Impr.','int'], ['clicks','Clicks','int'],
    ['conversions','Conv.','int'], ['cpc','CPC','eur2'],
  ];
  const rows = [...series].reverse();
  return (
    <>
      <Card>
        <TileHead title="Daily metrics export"
          note="One row per period with the current filters applied, most recent first. Every ratio here is re-derived at the displayed grain rather than averaged." />
        <div className="overflow-auto px-4 pb-4 max-h-[520px]">
          <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
            <thead className="sticky top-0" style={{ background: C.surface }}>
              <tr>{COLS.map(([k, l], i) => (
                <th key={k} className={'py-1.5 font-medium whitespace-nowrap ' + (i ? 'text-right pl-3' : 'text-left pr-3')}
                    style={{ color: C.faint }}>{l}</th>))}</tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key} style={{ borderTop: `1px solid ${C.grid}` }}>
                  {COLS.map(([k, , f], i) => (
                    <td key={k} className={'py-1.5 whitespace-nowrap ' + (i ? 'text-right pl-3' : 'text-left pr-3 font-medium')}
                        style={{ color: i && ['attRevenue','newCust','impressions','clicks','conversions'].includes(k) ? C.mid : C.ink,
                                 fontVariantNumeric: TYPE.numeric }}>
                      {f === 'txt' ? r[k] : fmt(r[k], f)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Note title="Definitions — the four things people get wrong" items={[
        { b: 'Net revenue', t: 'amounts actually collected, before taxes. Used in every profitability ratio on this dashboard.' },
        { b: 'Attributed revenue', t: "the ad platform's own claim — includes VAT and a broader attribution window, so it is structurally higher. Never used in a ratio here." },
        { b: 'All marketing vs ads only', t: 'identical on 98.5% of days; the two diverge only while an influencer campaign is running.' },
        { b: 'Pre-ads history', t: 'six years of orders exist before paid media started in April 2026, with no media behind them. They are excluded everywhere so COS and CAC are never computed against them.' },
      ]} />
    </>
  );
}
