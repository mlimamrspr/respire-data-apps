// Semantic layer of the Synthèse page: explores, fields and base queries.
// Dot notation everywhere: rows come back keyed by the exact string passed to the builder.
// Only additive components are queried; ratios (AOV, attainment, shares) are derived client-side.
import { query } from '@lightdash/query-sdk';

export const TX = 'dtm_b2b_pharma_transactions_v2';
export const OL = 'dtm_b2b_pharma_order_lines_v2';
export const CU = 'dtm_b2b_pharma_customers_v2';
export const HI = 'dtm_b2b_pharma_history_v2';
export const HQ = 'primary_b2b_pharma_hq_objectives';

export const F = {
  tx: {
    date: `${TX}.dt_reference`, market: `${TX}.name_market`, team: `${TX}.type_sales_team`,
    decile: `${TX}.categ_decile_skin`, type: `${TX}.type_transaction`, split: `${TX}.categ_turnover_split`,
    invoiced: `${TX}.total_amt_turnover_invoiced_bt_eur`, total: `${TX}.total_amt_turnover_bt_eur`,
    orders: `${TX}.nb_distinct_orders`,
  },
  ol: {
    date: `${OL}.dt_reference`, market: `${OL}.name_market`, team: `${OL}.type_sales_team`,
    decile: `${OL}.categ_decile_skin`, shelf: `${OL}.categ_shelf_product`,
    invoiced: `${OL}.total_amt_turnover_invoiced_bt_eur`, total: `${OL}.app_total_amt_turnover_bt_eur`,
  },
  cu: {
    market: `${CU}.name_market`, team: `${CU}.type_sales_team`, decile: `${CU}.categ_decile_skin`,
    openingDate: `${CU}.dt_commercial_opening_in_progress`, invoicedDate: `${CU}.dt_commercial_opening`,
    skinDate: `${CU}.dt_first_skin_order`,
    openings: `${CU}.nb_distinct_openings`, invoiced: `${CU}.nb_distinct_invoiced_openings`,
    deo: `${CU}.nb_distinct_deo_openings`, skinOpenings: `${CU}.nb_distinct_skin_openings`,
    skin: `${CU}.nb_distinct_new_skin_doors`, conversions: `${CU}.nb_distinct_deo_to_skin_conversions`,
  },
  hi: {
    day: `${HI}.dt_day`, market: `${HI}.name_market`, team: `${HI}.type_sales_team`,
    decile: `${HI}.categ_decile_skin`,
    active: `${HI}.nb_distinct_active_pharmacies`, deo: `${HI}.nb_distinct_active_deo_pharmacies`,
    skin: `${HI}.nb_distinct_active_skin_pharmacies`,
  },
  hq: {
    month: `${HQ}.dt_month`, team: `${HQ}.type_sales_team`,
    ca: `${HQ}.total_amt_obj_turnover_bt_eur`, caSkin: `${HQ}.total_amt_obj_turnover_skin_bt_eur`,
    caRepeat: `${HQ}.total_amt_obj_turnover_repeat_orders_bt_eur`,
    caPreorders: `${HQ}.total_amt_obj_turnover_preorders_bt_eur`,
    caOpening: `${HQ}.total_amt_obj_turnover_opening_orders_bt_eur`,
    nbRepeat: `${HQ}.total_count_obj_repeat_orders`, nbPreorders: `${HQ}.total_count_obj_preorders`,
    nbOpening: `${HQ}.total_count_obj_opening_orders`,
    active: `${HQ}.total_count_obj_active_pharmacies`, activeSkin: `${HQ}.total_count_obj_active_skin_pharmacies`,
    deoOpenings: `${HQ}.total_count_obj_deo_openings`, skinOpenings: `${HQ}.total_count_obj_skin_openings`,
    conversions: `${HQ}.total_count_obj_deo_to_skin_conversions`, skinDoors: `${HQ}.total_count_obj_new_skin_doors`,
  },
};

// Every pharma-hq-dash chart is filtered on France.
export const MARKET = 'France';
export const TEAM = { terrain: 'Terrain', is: 'IS' };
export const SKIN_SHELVES = ['Skincare', 'Suncare'];
export const SUN_SHELF = 'Suncare';
// categ_turnover_split values (Lightdash SQL dimension, null for refunds).
export const SPLIT = { repeat: 'Réassort', preorders: 'TF', opening: 'Implantation' };

// order_lines_v2 exposes no ongoing turnover metric, only the hidden column it would sum.
const OL_EXTRA_METRICS = [{
  name: 'app_total_amt_turnover_bt_eur',
  label: 'Total Turnover BT',
  table: 'dtm_b2b_pharma_order_lines_v2',
  type: 'sum',
  sql: '${TABLE}.amt_turnover_bt_eur',
}];

const caMetrics = [F.tx.invoiced, F.tx.total];
const olMetrics = [F.ol.invoiced, F.ol.total];
const openingMetrics = [F.cu.openings, F.cu.deo, F.cu.skinOpenings];

export const Q = {
  ca: query(TX).label('Synthèse · CA').metrics(caMetrics).limit(1),
  caN1: query(TX).label('Synthèse · CA n-1').metrics(caMetrics).limit(1),
  typology: query(TX).label('Synthèse · CA par typologie')
    .dimensions([F.tx.split]).metrics([F.tx.total, F.tx.orders]).limit(10),
  gammes: query(OL).label('Synthèse · CA par rayon').dimensions([F.ol.shelf])
    .metrics(olMetrics).additionalMetrics(OL_EXTRA_METRICS).limit(20),
  gammesN1: query(OL).label('Synthèse · CA par rayon n-1').dimensions([F.ol.shelf])
    .metrics(olMetrics).additionalMetrics(OL_EXTRA_METRICS).limit(20),
  park: query(HI).label('Synthèse · Parc actif').metrics([F.hi.active, F.hi.deo, F.hi.skin]).limit(1),
  parkN1: query(HI).label('Synthèse · Parc actif n-1').metrics([F.hi.active, F.hi.deo, F.hi.skin]).limit(1),
  parkTeams: query(HI).label('Synthèse · Parc actif par équipe')
    .dimensions([F.hi.team]).metrics([F.hi.active]).limit(10),
  openings: query(CU).label('Synthèse · Ouvertures').metrics(openingMetrics).limit(1),
  openingsN1: query(CU).label('Synthèse · Ouvertures n-1').metrics(openingMetrics).limit(1),
  openingsTeams: query(CU).label('Synthèse · Ouvertures par équipe')
    .dimensions([F.cu.team]).metrics([F.cu.openings, F.cu.deo]).limit(10),
  invoicedOpenings: query(CU).label('Synthèse · Ouvertures facturées').metrics([F.cu.invoiced]).limit(1),
  skinDoors: query(CU).label('Synthèse · Nouvelles portes skin')
    .metrics([F.cu.skin, F.cu.conversions]).limit(1),
  objectives: query(HQ).label('Synthèse · Objectifs siège par mois et équipe')
    .dimensions([F.hq.month, F.hq.team])
    .metrics([
      F.hq.ca, F.hq.caSkin, F.hq.caRepeat, F.hq.caPreorders, F.hq.caOpening,
      F.hq.nbRepeat, F.hq.nbPreorders, F.hq.nbOpening, F.hq.active, F.hq.activeSkin,
      F.hq.deoOpenings, F.hq.skinOpenings, F.hq.conversions, F.hq.skinDoors,
    ])
    .limit(500),
};

// Market, Canal and Décile filters of an explore carrying those dimensions.
export function scopeFilters(f, { canal, deciles }) {
  const out = [{ field: f.market, operator: 'equals', value: [MARKET] }];
  if (TEAM[canal]) out.push({ field: f.team, operator: 'equals', value: [TEAM[canal]] });
  if (deciles.length) out.push({ field: f.decile, operator: 'equals', value: deciles });
  return out;
}

export const between = (field, from, to) => ({ field, operator: 'inBetween', value: [from, to] });
export const onDay = (field, day) => ({ field, operator: 'equals', value: [day] });
