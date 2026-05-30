# 311 Pulse — Build Plan & Shared Contracts

---
## 🗺️ Overall Progress — Last Updated 2026-05-30

| Phase | Status | Progress | Next Action |
|---|---|---|---|
| [Phase 0 — Foundations](./00-foundations.md) | 🟢 Complete | `██████████████` 100% | Done — schema live at `wry-mandrill-452.convex.cloud` |
| [Phase 1 — Data Pipeline](./01-data-pipeline.md) | 🔴 Not Started | `░░░░░░░░░░░░░░` 0% | Build `ingest_311.py` + CKAN fetch |
| [Phase 2 — Backend & Agent](./02-backend-and-agent.md) | 🟡 In Progress | `████████████░░` 87% | Seed Convex + run smoke tests against live endpoints |
| [Phase 3 — Frontend & Generative UI](./03-frontend-and-generative-ui.md) | 🟡 In Progress | `████░░░░░░░░░░` 25% | Redeploy on Vercel (clear cache) to verify Lightning CSS Linux binary, then build map component |
| [Phase 4 — Polish & Submission](./04-polish-and-submission.md) | 🔴 Not Started | `░░░░░░░░░░░░░░` 0% | Blocked on Phases 1–3 golden path |

**Overall:** ~55% complete · **Deadline:** Sun May 31, 11:00 AM

> 🔑 **Phase 0 is done. Next unblocking action:** Build the Mastra agent tools in Phase 2 (`agent/tools/`) against the live Convex deployment.

---

This folder is the **build contract** for 311 Pulse. The vision lives in [`../prd.md`](../prd.md); the *how* lives here.

Each phase file is **self-contained**: it states its goal, inputs, tasks (file-by-file), code stubs, and acceptance criteria. A separate agent can be handed a single phase file and build it without reading the others — **as long as everyone respects the shared contracts in §3 below**.

## 1. Phases

| # | File | Depends on | Can start when |
|---|---|---|---|
| 0 | [`00-foundations.md`](./00-foundations.md) | — | Now |
| 1 | [`01-data-pipeline.md`](./01-data-pipeline.md) | Phase 0 contracts only | Contracts frozen |
| 2 | [`02-backend-and-agent.md`](./02-backend-and-agent.md) | Phase 0 contracts; Phase 1 artifact *schema* (not data) | Contracts frozen |
| 3 | [`03-frontend-and-generative-ui.md`](./03-frontend-and-generative-ui.md) | Phase 0 contracts; Phase 2 tool/query *signatures* | Contracts frozen |
| 4 | [`04-polish-and-submission.md`](./04-polish-and-submission.md) | Phases 1–3 working | Golden path runs |

**Key insight for parallelism:** Phases 1, 2, and 3 each depend only on the **contracts** (§3), not on each other's finished code. Phase 0 freezes those contracts and ships mock/stub data so every later phase can build and self-test in isolation. Wire real data in last.

### Suggested team split (2–4 people)
Once Phase 0 lands and contracts are frozen, run the next three phases **in parallel**:

| Owner | Phase | Works in |
|---|---|---|
| Data / GPU person | Phase 1 — pipeline + RAPIDS on the Spark | `pipeline/` |
| Backend / AI person | Phase 2 — Convex + Mastra + Nemotron | `convex/`, `agent/` |
| Frontend person | Phase 3 — map, chat, generative UI | `app/` |

Everyone codes against the mock artifacts + frozen signatures from Phase 0, so no one is blocked. The fourth person (or whoever finishes first) starts Phase 4 hardening + demo. **The agent + map golden path (`prd.md` §9) is the priority** — predictions/dashboard support it.

> **Spark availability:** the DGX Spark is available throughout, so the Phase 1 owner should run RAPIDS (`PIPELINE_ENGINE=rapids`) on the Spark as the primary path and capture the CPU-vs-GPU benchmark early — it's the headline NVIDIA story.

## 2. How to run a phase as an agent

> "Build Phase N of 311 Pulse. Read `docs/0N-*.md` and `docs/README.md` (contracts §3) only. Implement every task, meet every acceptance criterion, and run the self-test commands at the bottom. Do not change any shared contract without flagging it. Report what passed/failed with command output."

## 3. Shared Contracts (the freeze) 🔒

> **Rule:** No phase may silently change anything in this section. If a contract must change, update it here first and note the affected phases.

### 3.1 Repository layout

```
nvidia-hackathon/
├─ prd.md
├─ docs/                      # this build plan
├─ app/                       # Next.js 16 App Router
│  ├─ app/                    # routes
│  ├─ components/             # UI + generative UI components
│  ├─ lib/                    # client helpers
│  └─ ...
├─ convex/                    # Convex schema + functions
│  ├─ schema.ts
│  ├─ queries.ts
│  ├─ mutations.ts
│  └─ http.ts
├─ agent/                     # Mastra agent + tools + LLM provider
│  ├─ index.ts
│  ├─ tools/
│  └─ llm.ts
├─ pipeline/                  # Python data pipeline (engine-agnostic)
│  ├─ src/
│  ├─ pyproject.toml
│  └─ artifacts/              # generated Parquet/JSON (gitignored)
├─ packages/contracts/        # SHARED TypeScript types + Zod schemas (single source)
│  └─ src/index.ts
├─ scripts/                   # import + dev scripts
├─ .env.example
└─ README.md
```

> Note: `app/`, `convex/`, and `agent/` may live in one Next.js project root if a single-package layout is simpler for a solo build. The **contracts package is the one non-negotiable boundary** — types flow from there.

### 3.2 Core data model (shared types)

These types are defined once in `packages/contracts/src/index.ts` (TS) and mirrored as Zod schemas. The Python pipeline emits artifacts matching the same shapes. **This is the spine of the whole system.**

```ts
// Geographic unit
export type Ward = {
  wardId: string;          // "ward-01" ... canonical id
  wardName: string;
  neighbourhoods: string[];
};

// One processed 311 record (post-enrichment) — used for summaries/RAG, not raw bulk
export type ServiceRequest = {
  id: string;
  createdAt: string;       // ISO date
  category: string;        // normalized: "pothole" | "garbage" | "flooding" | ...
  wardId: string;
  neighbourhood: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
};

// Daily aggregate per ward × category (the analytics backbone)
export type DailyAggregate = {
  date: string;            // ISO date (YYYY-MM-DD)
  wardId: string;
  category: string;
  count: number;
  // weather joined for that day/ward
  tempC: number | null;
  precipMm: number | null;
};

// Forecast output per ward × category for a future window
export type Forecast = {
  wardId: string;
  category: string;
  horizonStart: string;    // ISO date
  horizonEnd: string;
  predictedCount: number;
  confidenceLow: number;
  confidenceHigh: number;
  method: string;          // "prophet" | "movingavg" | "cuml-..." etc.
};

// Hotspot cluster (spatial)
export type Hotspot = {
  category: string;
  wardId: string;
  neighbourhood: string | null;
  centroidLat: number;
  centroidLng: number;
  intensity: number;       // 0..1 normalized
  count: number;
};

// Risk score per ward (composite)
export type RiskScore = {
  wardId: string;
  category: string;        // or "all"
  score: number;           // 0..100
  drivers: string[];       // human-readable: ["heavy rain forecast", "rising trend"]
  asOf: string;            // ISO date
};

// Run metadata — supports the "honest Spark story" benchmark
export type PipelineRun = {
  runId: string;
  engine: "pandas" | "polars" | "duckdb" | "rapids";
  rowsProcessed: number;
  durationSec: number;
  createdAt: string;
};
```

### 3.3 Pipeline artifact contract (Phase 1 → Phase 2)

The pipeline writes to `pipeline/artifacts/` (and a copy the import script reads). **File names and schemas are fixed:**

| File | Schema | Notes |
|---|---|---|
| `wards.json` | `Ward[]` | Static-ish reference |
| `daily_aggregates.parquet` | `DailyAggregate[]` | The big one |
| `forecasts.json` | `Forecast[]` | Demo horizon = next 7 days |
| `hotspots.json` | `Hotspot[]` | Top N per category |
| `risk_scores.json` | `RiskScore[]` | Per ward × top categories |
| `request_summaries.json` | `{ category, wardId, period, summary }[]` | For RAG |
| `pipeline_run.json` | `PipelineRun` | Benchmark metadata |

Phase 0 ships **mock versions** of every file (tiny but schema-valid) so Phases 2 and 3 can build before Phase 1 finishes.

### 3.4 Convex query/mutation signatures (Phase 2 → Phase 3 & Agent)

Frozen names and shapes (implementation in Phase 2):

```ts
// queries.ts
listWards(): Ward[]
getDailyAggregates(args: { wardId?: string; category?: string; from?: string; to?: string }): DailyAggregate[]
getForecast(args: { wardId?: string; category?: string }): Forecast[]
getHotspots(args: { category?: string }): Hotspot[]
getRiskScores(args: { wardId?: string }): RiskScore[]
searchSummaries(args: { query: string; limit?: number }): { category:string; wardId:string; period:string; summary:string }[]
getPipelineRun(): PipelineRun | null

// mutations.ts  (used by import script)
importArtifacts(args: { /* batched payloads */ }): { ok: true }
```

### 3.5 Mastra agent tool contract (Phase 2 → Phase 3 UI)

The agent exposes these tools. The UI's generative components key off the tool **name** and **output shape**:

| Tool | Input | Output | Generative UI it triggers |
|---|---|---|---|
| `queryRequests` | `{ category?, wardId?, from?, to? }` | `DailyAggregate[]` | trend line chart |
| `getForecast` | `{ category?, wardId? }` | `Forecast[]` | ranked bar chart + map highlight |
| `getHotspots` | `{ category? }` | `Hotspot[]` | map heat layer |
| `getRiskScore` | `{ wardId? }` | `RiskScore[]` | risk panel / map choropleth |
| `simulateWeather` | `{ scenario, category? }` | `Forecast[]` | (nice-to-have) before/after chart |

### 3.6 Environment variables (single `.env.example`)

```
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# LLM (Nemotron via NIM primary, OpenAI-compatible fallback)
LLM_PROVIDER=nim            # "nim" | "fallback"
NIM_BASE_URL=http://localhost:8000/v1   # or hosted NVIDIA endpoint
NIM_API_KEY=
NIM_MODEL=nvidia/nemotron-...
FALLBACK_BASE_URL=
FALLBACK_API_KEY=
FALLBACK_MODEL=

# CopilotKit
NEXT_PUBLIC_COPILOTKIT_URL=/api/copilotkit

# Pipeline
PIPELINE_ENGINE=pandas      # "pandas" | "polars" | "duckdb" | "rapids"
```

### 3.7 LLM provider abstraction (Phase 0 stub → Phase 2 real)

A single `agent/llm.ts` returns an OpenAI-compatible client configured from env. Both NIM and the fallback speak the OpenAI Chat Completions API, so switching is just base URL + key + model. **No other file constructs an LLM client.**

## 4. Definition of Done per phase
Each phase file ends with **Acceptance Criteria** and **Self-Test** commands. A phase is "done" only when every box is checked and self-tests pass with output captured.

## 5. Conventions
- TypeScript strict mode; `zod` validates anything crossing a boundary.
- Python: `uv` (or venv) + `ruff`; type hints; `polars`/`pandas` interchangeable behind `engine.py`.
- Commit per phase milestone. Keep `artifacts/` and `.env` gitignored.
- When blocked on a contract, **update §3 here**, don't fork the type locally.
