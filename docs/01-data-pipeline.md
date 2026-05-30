# Phase 1 — Data Pipeline (Engine-Agnostic, RAPIDS-Ready)

> **Goal:** Turn raw Open Data Toronto 311 + weather + ward boundaries into the **artifact contract** (`docs/README.md` §3.3). The same code runs on pandas/Polars/DuckDB locally and on **RAPIDS (cuDF/cuML)** on the DGX Spark via the `PIPELINE_ENGINE` flag. Produce an **honest CPU-vs-GPU benchmark**.

**Owner agent scope:** Read this file + `docs/README.md` §3 (contracts §3.2, §3.3). Replace the Phase 0 mock artifacts with real, processed ones. **Do not change the artifact schemas** — Phase 2 depends on them.

**Outcome:** `python -m pipeline.src.run` ingests data and writes all 7 artifacts with real Toronto data. A benchmark records engine + duration + rows in `pipeline_run.json`.

---

## 0. Inputs
- Engine abstraction `pipeline/src/engine.py` (from Phase 0).
- Artifact schemas frozen in §3.3.
- Network access to Open Data Toronto (CKAN) + Environment Canada.

## 1. Data Acquisition

### 1.1 311 Service Requests (CKAN)
- [ ] Implement `pipeline/src/ingest_311.py` that fetches the **311 Service Requests (Customer Initiated)** package via the CKAN API.
  - CKAN package endpoint: `https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=311-service-requests-customer-initiated`
  - List resources, download the per-year CSV resources (datastore or direct CSV).
- [ ] **Sample first:** support `--sample N` to pull a single recent year / N rows for fast Mac iteration. Full multi-year run is reserved for the Spark.
- [ ] Cache raw downloads under `pipeline/data/raw/` (gitignored).

### 1.2 Ward & neighbourhood boundaries
- [ ] Download City of Toronto **Ward Boundaries** and **Neighbourhoods** GeoJSON via CKAN.
- [ ] Store under `pipeline/data/geo/`.

### 1.3 Weather (Environment Canada)
- [ ] Implement `pipeline/src/ingest_weather.py` to fetch daily historical climate data (Toronto station) — temp + precipitation — covering the 311 date range, plus a simple near-term forecast for the demo horizon (next 7 days). A static/cached forecast JSON is acceptable for the demo.
- [ ] Store under `pipeline/data/weather/`.

## 2. Transform & Enrich

### 2.1 Clean & normalize
- [ ] Parse 311 records: creation date, status, ward, service request type, address/intersection.
- [ ] **Normalize categories** into a small canonical set used everywhere: at minimum `pothole`, `garbage`, `flooding`, `graffiti`, `tree`, `noise`, `other`. Implement a mapping table `pipeline/src/categories.py` from raw 311 types → canonical.
- [ ] Drop/repair rows with no date or no ward.

### 2.2 Geospatial enrichment
- [ ] Assign each request to a ward + neighbourhood via point-in-polygon when lat/lng present; else use the ward field / address geocode fallback.
- [ ] Use `geopandas` / `shapely` on CPU; on RAPIDS use `cuspatial` point-in-polygon (guarded import, same interface).
- [ ] Produce canonical `wards.json` (`Ward[]`).

### 2.3 Weather join
- [ ] Join daily weather to each request's date (city-level is fine for v1; ward-level optional).

## 3. Analytics (the value)

### 3.1 Daily aggregates → `daily_aggregates.parquet`
- [ ] Group by `date × wardId × category` → `count`, attach `tempC`, `precipMm`. This is the analytics backbone (`DailyAggregate[]`).

### 3.2 Hotspot detection → `hotspots.json`
- [ ] Cluster recent request points per category (DBSCAN). CPU: `sklearn.cluster.DBSCAN`. GPU: `cuml.DBSCAN` (same params, guarded import).
- [ ] Emit top-N clusters per category with centroid, intensity (normalized density 0..1), count (`Hotspot[]`).

### 3.3 Forecasting → `forecasts.json`
- [ ] For each `wardId × category`, forecast the **next 7 days** total.
  - v1 method: seasonal moving average / simple regression on day-of-week + recent trend + precipitation feature. Set `method` accordingly.
  - Optional upgrade: Prophet or a small statsmodels model.
- [ ] Emit `predictedCount`, `confidenceLow/High` (`Forecast[]`).

### 3.4 Risk scoring → `risk_scores.json`
- [ ] Composite 0..100 per `wardId × category` from: forecast vs. historical baseline, weather-driven risk (e.g. heavy precip → flooding/pothole), recent trend slope.
- [ ] Populate `drivers` with human-readable reasons (e.g. `["heavy rain forecast", "rising 14-day trend"]`) — the agent surfaces these. (`RiskScore[]`)

### 3.5 RAG summaries → `request_summaries.json`
- [ ] Generate short natural-language summaries per `category × ward × period` (template-based is fine), e.g. "Scarborough pothole requests rose 32% in weeks following >20mm rain in 2024." Used for agent RAG.

## 4. Engine abstraction & RAPIDS path
- [ ] All heavy ops (read, groupby/agg, join, clustering) go through `engine.py` so switching `PIPELINE_ENGINE=pandas|polars|duckdb|rapids` changes nothing in business logic.
- [ ] RAPIDS branch (`cudf`, `cuml`, `cuspatial`) is import-guarded: on Mac it raises a clear "run on Spark" error; on Spark it activates.
- [ ] Document the exact Spark run command in the pipeline README section.

## 5. Benchmark (honest Spark story) → `pipeline_run.json`
- [ ] Time the full transform+analytics stage; record `engine`, `rowsProcessed`, `durationSec` (`PipelineRun`).
- [ ] The Spark is available — make **RAPIDS the primary full-scale run**: run on Mac (pandas/polars, sampled) for the CPU baseline and on the Spark (`--engine rapids`, full dataset) for the GPU number. Report the **measured** speedup in the README — do not invent numbers.
- [ ] Capture this benchmark **early** (as soon as the pipeline runs end-to-end), since it's the headline NVIDIA story and `/dashboard` surfaces it.

## 6. Orchestration
- [ ] `pipeline/src/run.py` runs the full DAG: ingest → enrich → analytics → write artifacts → write run metadata.
- [ ] Flags: `--sample N`, `--engine <name>` (overrides env), `--skip-download`.
- [ ] Writes to `pipeline/artifacts/`, replacing Phase 0 mocks. **Schemas must validate against §3.3.**

## 7. Acceptance Criteria
- [ ] `python -m pipeline.src.run --sample 50000` completes on Mac and writes all 7 artifacts.
- [ ] Every artifact validates against the §3.3 schemas (add a `validate.py` that loads each and checks shape).
- [ ] `daily_aggregates.parquet` has real counts across multiple wards/categories/dates.
- [ ] `forecasts.json` covers the next-7-day horizon for the demo categories.
- [ ] `risk_scores.json` entries have non-empty `drivers`.
- [ ] `pipeline_run.json` records engine + duration + rows.
- [ ] Switching `--engine polars` and `--engine duckdb` both succeed (proves abstraction).
- [ ] RAPIDS branch import-guards cleanly on Mac (no crash, clear message).

## 8. Self-Test (capture output)
```bash
python -m pipeline.src.run --sample 50000 --engine pandas
python -m pipeline.src.validate         # all 7 artifacts schema-valid
python -m pipeline.src.run --sample 50000 --engine polars   # abstraction works
cat pipeline/artifacts/pipeline_run.json
# then load into Convex via Phase 0 import script:
npm run import
```

## 9. Handoff
- Real artifacts now sit in `pipeline/artifacts/`. Phase 2's import + queries serve real data with zero code change (same schemas).
- Record the benchmark number for Phase 4's README/Spark story.
