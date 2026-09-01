# Semantic layer — 4 models

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
dtm_d2c_spend_it_esp  dtm_d2c_spend_it_esp.yml  dims=10 metrics=21  joins=dtm_d2c_orders_it_esp  Daily marketing spend fact table for the Italy and Spain export markets, combining Meta Ads and Influence costs. 
dtm_d2c_orders_it_esp  dtm_d2c_orders_it_esp.yml  dims=11 metrics=6  joins=-  One row per order for the Italy and Spain export markets, with revenue and new-vs-returning / influence attribution flag
dtm_b2b_transactions_monthly_vs_obj  dtm_b2b_transactions_monthly_vs_obj.yml  dims=5 metrics=0  joins=-
dtm_d2c_product_sales_it_esp  dtm_d2c_product_sales_it_esp.yml  dims=13 metrics=2  joins=-  One row per day, export market and SKU, with the quantity sold and the revenue before taxes, for the Italy and Spain mar
