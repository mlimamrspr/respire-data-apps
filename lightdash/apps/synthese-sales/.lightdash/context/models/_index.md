# Semantic layer — 10 models

Every model in this project is listed below, most-queried first. Read
only the model files you need — never the whole directory. To locate a
field whose model you do not know, Grep this directory for its name.
Mind the YAML shape: dimensions are `- name:` list entries under
`columns:`, but metrics are mapping keys under `meta.metrics:` — a
grep for `- name:` enumerates only dimensions, never metrics.
A `filters=` marker means the model declares model-level filters
(required/default/sql_filter) that affect every query against it —
read that model file before querying it.

name  file  dims/metrics  joins  [filters]  description
dtm_b2b_pharma_customer_cycles  dtm_b2b_pharma_customer_cycles.yml  dims=11 metrics=5  joins=-  Pharmacy achievements on the field sales incentives ("primés") of a cycle, one row per pharmacy (CIP), cycle and sector 
dtm_b2b_pharma_customers_v2  dtm_b2b_pharma_customers_v2.yml  dims=30 metrics=11  joins=hq_objectives_openings,hq_objectives_skin_doors  Pharma B2B customers (one row per Odoo customer), with columns renamed to the Respire naming conventions. Reads dtm_b2b_
dtm_b2b_pharma_history_v2  dtm_b2b_pharma_history_v2.yml  dims=10 metrics=6  joins=primary_b2b_pharma_hq_objectives  Daily snapshot of the pharma B2B customers (one row per Odoo customer and day since 2023-01-01), with columns renamed to
dtm_b2b_pharma_order_lines_v2  dtm_b2b_pharma_order_lines_v2.yml  dims=14 metrics=6  joins=primary_b2b_pharma_hq_objectives  Pharma B2B order lines (one row per product line and invoice), with columns renamed to the Respire naming conventions. R
dtm_b2b_pharma_transactions_v2  dtm_b2b_pharma_transactions_v2.yml  dims=17 metrics=10  joins=primary_b2b_pharma_objectives,primary_b2b_pharma_hq_objectives  Pharma B2B orders and refunds (one row per order or per refund), with columns renamed to the Respire naming conventions.
dtm_b2b_transactions_monthly_vs_obj  dtm_b2b_transactions_monthly_vs_obj.yml  dims=5 metrics=0  joins=-
hq_objectives_openings  hq_objectives_openings.yml  dims=0 metrics=3  joins=-  Monthly pharma objectives of the headquarters view, one row per month and sales team (Terrain or IS), from the "objectif
hq_objectives_skin_doors  hq_objectives_skin_doors.yml  dims=0 metrics=3  joins=-  Monthly pharma objectives of the headquarters view, one row per month and sales team (Terrain or IS), from the "objectif
primary_b2b_pharma_hq_objectives  primary_b2b_pharma_hq_objectives.yml  dims=5 metrics=18  joins=-  Monthly pharma objectives of the headquarters view, one row per month and sales team (Terrain or IS), from the "objectif
primary_b2b_pharma_objectives  primary_b2b_pharma_objectives.yml  dims=7 metrics=15  joins=dtm_b2b_pharma_customers_v2,dtm_b2b_pharma_customer_cycles,dtm_b2b_pharma_transactions_v2  Pharma field sales objectives, one row per sales cycle and sector, from the objectives sheet maintained by the B2B team.
