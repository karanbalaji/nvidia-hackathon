# 311 Pulse — Predictive & Agentic 311 Intelligence System

> **Single source of truth** for vision, scope, and architecture.
> Granular, build-ready steps live in [`/docs`](./docs/README.md) — one self-contained phase per file.

## 1. Project Overview

**Project Name**: 311 Pulse
**Track**: Public Services
**Hackathon**: NVIDIA + City of Toronto Hackathon (May 2026)
**Team**: Karan + small team (2–4), building with Claude Code agents
**Submission Deadline**: Sunday, May 31st, 11:00 AM
**Build environment**: **DGX Spark (ASUS Ascent GX10) available throughout** — develop fast on macOS (sampled data), run full-scale GPU jobs on the Spark

### Vision
Build a **functioning, agentic system** that turns Toronto's raw 311 Service Requests data into **predictive, actionable intelligence**, accelerated by the **DGX Spark** and powered by **NVIDIA Nemotron**.

**311 Pulse** ingests historical 311 data, enriches it with weather and geospatial context, runs GPU-accelerated analysis, and exposes an intelligent agent that answers complex questions, renders live maps/charts, and recommends proactive actions for City staff and residents.

### Core Objectives
- Demonstrate **end-to-end systems engineering**: raw data → GPU-accelerated processing → agentic reasoning → polished UI.
- Maximize **NVIDIA ecosystem usage** (RAPIDS + Nemotron on DGX Spark) with a clear, credible Spark story.
- Deliver **real, non-obvious value** to Toronto's 311 operations and residents.
- Ship a working system + 3–5 min demo video by the deadline.

### Guiding Constraints (decisions locked for this build)
1. **RAPIDS-first, engine-agnostic.** The Spark is available now, so **RAPIDS (cuDF / cuML / cuspatial)** is the primary processing path and the headline NVIDIA story. The pipeline is engine-agnostic so the *same* code runs on pandas/Polars/DuckDB for fast local iteration on sampled data, then full-scale on the Spark via one config flag — which also gives us an honest CPU-vs-GPU benchmark.
2. **Small team, parallel phases.** 2–4 people (plus agents) split the work. Every phase doc is self-contained and buildable independently against the shared contracts in [`docs/README.md`](./docs/README.md), so data / backend / frontend can run in parallel from day one.
3. **The agent + map is the star.** The "wow" is natural-language questions answered with a live, generative map/chart experience. Predictions, forecasts, and the dashboard exist to *feed and justify* the agent's answers — they are the supporting cast, not a co-headline.
4. **LLM is abstracted.** Nemotron (via NIM, local on the Spark or hosted) is primary; an OpenAI-compatible fallback keeps us live if NIM is unavailable.

## 2. Problem Statement

Toronto's 311 system receives **hundreds of thousands of requests yearly**. Current processes are largely **reactive**. City planners and maintenance teams lack tools to:
- Predict upcoming service-request surges
- Correlate requests with weather and events
- Prioritize crews intelligently across wards
- Give residents proactive, neighbourhood-level insight

**Opportunity**: combine open data + modern AI to shift from reactive to **proactive** urban service delivery.

## 3. Target Users & Use Cases

### Primary Users
1. **City Operations / 311 Staff** — prioritization & forecasting
2. **Ward Councillors / Planners** — neighbourhood insights
3. **Residents** — proactive alerts & self-service

### Key User Stories (these drive the demo)
- *Planner:* "Which wards will see the highest **pothole** complaints next week given the forecast?"
- *Resident:* "Is my neighbourhood at risk for **flooding** this weekend?"
- *Analyst:* "Show me **garbage-collection** complaints correlated with **heavy rain** in **Scarborough** last year."

Each story must be answerable **end-to-end** in the finished demo: question → agent reasons → tool call → map/chart renders → recommendation.

## 4. Features & Requirements

### 4.1 Core Features (MVP — Must Have)

**Data Pipeline** ([Phase 1](./docs/01-data-pipeline.md))
- Ingest & process historical 311 Service Requests (start sampled, scale up)
- Geospatial enrichment (ward + neighbourhood assignment)
- Weather correlation (historical + simple forecast)
- Feature engineering (time, weather, location, category)
- Emit versioned **artifacts** (Parquet/JSON) matching the data contract

**Analytics Engine** ([Phase 1](./docs/01-data-pipeline.md))
- Hotspot detection (cuML/RAPIDS path; scikit-learn fallback)
- Time-series forecasting per ward × category
- Risk scoring per ward / neighbourhood

**Agentic Intelligence Layer** ([Phase 2](./docs/02-backend-and-agent.md))
- **NVIDIA Nemotron** via NIM (local or hosted), behind an LLM provider abstraction
- Multi-step reasoning agent (**Mastra**)
- RAG over processed insights + data summaries
- Tool calling: data queries, map rendering, forecast lookup, what-if simulation

**User Interface** ([Phase 3](./docs/03-frontend-and-generative-ui.md))
- Next.js 16 (App Router) web app
- Interactive Toronto map (heatmaps, predicted hotspots, risk overlays)
- **CopilotKit** chat with **generative UI** (agent renders charts/maps inline)
- Operations dashboard view

### 4.2 Nice-to-Have (only after golden path works)
- What-if weather scenario simulation (live)
- Resident-facing proactive alerts (simulated)
- Exportable PDF/CSV reports for city staff
- Multi-agent split (analyst agent + recommender agent)

### 4.3 Explicitly Out of Scope (YAGNI)
- Auth / multi-tenant accounts
- Live streaming ingestion of new 311 tickets
- Mobile-native apps
- Production deployment hardening beyond demo reliability

## 5. Technical Architecture

### Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript | Fast, modern, great DX |
| **UI** | Tailwind v4 + shadcn/ui + Recharts | Polish & speed |
| **AI Chat / Copilot** | **CopilotKit** | Best-in-class agent UI, generative UI, tool calling |
| **AI Agents** | **Mastra** (TS agent framework) | Agents, workflows, memory, tools |
| **Backend / DB** | **Convex** | Real-time, reactive, great Next.js integration |
| **Data Processing** | **RAPIDS (cuDF/cuML)** on Spark; pandas/Polars/DuckDB fallback | GPU-accelerated, but never blocking |
| **LLM / Inference** | **NVIDIA Nemotron** via NIM (OpenAI-compatible); fallback provider | NVIDIA points + reliability |
| **Maps** | Leaflet (start) → Mapbox GL (if time) | Interactive Toronto maps |
| **Glue** | Zod, date-fns, lucide-react, Sonner | Quality of life |

### Architecture (data flow)

```
Open Data Toronto ─┐
Environment Canada ─┼─▶ [Phase 1: Pipeline]  engine-agnostic (pandas/Polars ↔ RAPIDS)
Ward boundaries ───┘        │  feature engineering · hotspots · forecasts · risk
                            ▼
                    artifacts/  (Parquet + JSON, versioned — THE DATA CONTRACT)
                            │
                    [Phase 2] convex import script
                            ▼
                    Convex DB  ◀──── queries ──── Mastra Agent + Tools ──── Nemotron (NIM)
                            │                            ▲                     (fallback LLM)
                            │                            │ CopilotKit runtime
                            ▼                            │
                    [Phase 3] Next.js UI ── chat · generative UI · Leaflet map · dashboard
```

### NVIDIA Spark Story (critical for judging)
> "We leverage the DGX Spark's large unified memory to hold the multi-year 311 dataset, geospatial joins, and Nemotron context together. RAPIDS gives us 20–50× faster geospatial and time-series analysis vs. CPU, and all inference runs locally via NIM for privacy and low latency. Our pipeline is engine-agnostic — the *same* code runs on a laptop for development and on the Spark for the full-scale, GPU-accelerated run."

The story is **honest**: we measure and report the actual CPU-vs-RAPIDS speedup we observe (see [Phase 1](./docs/01-data-pipeline.md) benchmark task).

## 6. Data Sources (Open Data Toronto)

**Primary**
- **311 Service Requests (Customer Initiated)** — Open Data Toronto (CKAN). Columns include creation date, status, ward, division/section, service request type, and address/intersection.
- **Ward & Neighbourhood boundaries** (GeoJSON) — for geospatial joins.
- **Weather** — Environment Canada historical climate data (daily temp, precipitation) + a simple forecast feed for the demo window.
- *Optional:* construction permits / road closures, events.

**Processing requirements**
- Handle millions of rows (sampled first, full on Spark)
- Geospatial point-in-polygon joins (request → ward/neighbourhood)
- Time-based aggregations (daily/weekly per ward × category)

See [Phase 1](./docs/01-data-pipeline.md) for exact CKAN access, schema, and the artifact contract.

## 7. Non-Functional Requirements

- **Performance**: agent answers feel responsive; simple data lookups < 2s. (Honest note: end-to-end LLM latency depends on NIM/model; we optimize tool calls and stream tokens.)
- **Reliability**: graceful error handling; LLM + engine fallbacks; demo never hard-crashes.
- **Privacy**: all sensitive processing runs locally on the GX10.
- **Demo-ready**: clean UI, compelling visuals, working chat on the golden path.
- **Code quality**: TypeScript everywhere on the app; typed contracts; clear folder structure; README with setup.

## 8. Success Metrics (Judging Alignment)

| Judging Category | How We Win |
|---|---|
| **Technical Execution (30)** | Full pipeline: raw data → RAPIDS → Convex → Mastra agent → UI, with measured speedup |
| **NVIDIA Ecosystem (30)** | Heavy RAPIDS + local Nemotron via NIM + credible Spark story |
| **Value & Impact (20)** | Actionable, ward-level insights usable by real city staff |
| **Innovation (20)** | Predictive + agentic + generative-UI combination |

**Definition of Done (MVP):** the three user stories in §3 each work end-to-end in the UI, backed by real processed data, with the agent calling tools and rendering generative UI.

## 9. The Golden Path (demo-critical — protect above all)

This is the thin vertical slice that MUST work. Build order in [`/docs`](./docs/README.md) protects it.

1. User opens app → sees Toronto map with a 311 heatmap + a forecast/risk panel.
2. User asks: *"Which wards will see the most pothole complaints next week?"*
3. Agent (Nemotron via Mastra) reasons → calls `getForecast` tool → Convex returns ranked wards.
4. UI renders a **generative** ranked bar chart + highlights those wards on the map.
5. Agent adds a **recommendation** ("pre-position crews in Ward X, Y").
6. Follow-up: *"Why those wards?"* → agent explains using weather correlation.

If everything else slips, **this** ships.

## 10. Implementation Plan → see [`/docs`](./docs/README.md)

| Phase | File | Outcome |
|---|---|---|
| 0 — Foundations | [`docs/00-foundations.md`](./docs/00-foundations.md) | Repo, all tooling, shared contracts, env, runnable skeletons |
| 1 — Data Pipeline | [`docs/01-data-pipeline.md`](./docs/01-data-pipeline.md) | Engine-agnostic pipeline → artifacts; benchmark |
| 2 — Backend & Agent | [`docs/02-backend-and-agent.md`](./docs/02-backend-and-agent.md) | Convex schema + import; Mastra agent + tools; Nemotron + fallback; CopilotKit runtime |
| 3 — Frontend & Generative UI | [`docs/03-frontend-and-generative-ui.md`](./docs/03-frontend-and-generative-ui.md) | Map, chat, generative charts, dashboard |
| 4 — Polish & Submission | [`docs/04-polish-and-submission.md`](./docs/04-polish-and-submission.md) | Reliability, README, demo video, submission |

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Data volume too big to process in time | Engine-agnostic pipeline; **sampled dataset first**, scale on Spark |
| Time pressure | Golden path (§9) first; everything else is additive |
| NIM/Nemotron unavailable | **LLM provider abstraction** with OpenAI-compatible fallback |
| GPU/RAPIDS env issues on Spark | Same code runs on CPU; RAPIDS is a flag, not a dependency |
| Map complexity | Leaflet first; Mapbox only if time |
| Integration drift between phases | **Shared contracts** frozen in Phase 0; phases code against them |

## 12. Deliverables for Submission

1. Public GitHub repository
2. Detailed `README.md` (architecture, NVIDIA/Spark story, setup, screenshots)
3. 3–5 min demo video (screen recording + voiceover)
4. Live demo on GX10 (if possible)

---

**This PRD is the vision contract. The `/docs` phase files are the build contract.**
