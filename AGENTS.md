# AGENTS.md — Agent Dispatch Guide for 311 Pulse

> Rules for any AI agent (Claude, Gemini, Copilot, etc.) working in this repository.
> For Claude Code–specific setup, also read `CLAUDE.md`.

---

## The One Rule

**The shared contracts in `docs/README.md §3` are frozen.** Every agent codes against them. No agent may silently change a type, artifact schema, query signature, or tool shape. If a change is genuinely necessary, update `docs/README.md §3` first and call it out explicitly.

---

## How to Pick Up a Phase

Each phase file is fully self-contained. When dispatched to build a phase:

1. **Read** your assigned phase doc (e.g. `docs/02-backend-and-agent.md`).
2. **Read** `docs/README.md §3` (shared contracts — the data spine).
3. **Read** `CLAUDE.md` (tech stack, commands, conventions).
4. If building frontend: **Read** `designsystem.md` before writing any UI code.
5. **Do not** read other phase files. Your phase file states exactly what you need.
6. Implement every task in the task list, in order.
7. Run the **Self-Test** commands at the bottom of your phase file and capture output.
8. Report: what passed, what failed, actual command output.

**Dispatch prompt template:**
```
Build Phase N of 311 Pulse. Read `docs/0N-*.md` and `docs/README.md` (contracts §3) only.
Implement every task, meet every acceptance criterion, and run the self-test commands at the
bottom. Do not change any shared contract without flagging it. Report what passed/failed with
command output.
```

---

## Phase Map & Parallelism

```
Phase 0 — Foundations          (must complete first — freezes contracts + ships mock data)
    │
    ├──► Phase 1 — Data Pipeline       (parallel, Python, pipeline/ only)
    ├──► Phase 2 — Backend & Agent     (parallel, convex/ + agent/)
    └──► Phase 3 — Frontend & Gen UI   (parallel, app/ only)
              │
              └──► Phase 4 — Polish & Submission  (needs 1–3 done)
```

Phases 1, 2, and 3 only depend on the **contracts** (§3), not on each other's finished code. Phase 0 ships mock artifacts so every later phase can build and self-test in isolation.

---

## Agent Role Definitions

### Phase 0 Agent — Foundations
**Scope:** `docs/00-foundations.md` + `docs/README.md §3`
**Works in:** entire repo (creates structure)
**Goal:** Running skeleton — `npm run dev` serves the app, Convex deploys, mock artifacts exist, agent compiles, lint passes.
**Critical deliverable:** Shared contracts package (`@311pulse/contracts`) is built and consumable by app, convex, and agent. Mock artifacts exist for all 7 files. All later agents depend on this.

### Phase 1 Agent — Data Pipeline
**Scope:** `docs/01-data-pipeline.md` + `docs/README.md §3`
**Works in:** `pipeline/` only
**Goal:** Real Toronto 311 data → 7 validated artifacts in `pipeline/artifacts/`. Engine-agnostic (pandas/Polars/DuckDB/RAPIDS via flag). Honest benchmark in `pipeline_run.json`.
**Key constraint:** Artifact schemas must match §3.3 exactly — Phase 2 imports them without modification.
**RAPIDS note:** RAPIDS imports are always guarded. Mac dev uses pandas/Polars. Spark run uses `PIPELINE_ENGINE=rapids`.

### Phase 2 Agent — Backend & Agent
**Scope:** `docs/02-backend-and-agent.md` + `docs/README.md §3`
**Works in:** `convex/`, `agent/`
**Goal:** Convex queries live, Mastra agent has real tools, Nemotron (NIM) works with fallback, CopilotKit chat returns real tool-grounded answers.
**Key constraint:** Tool output shapes (§3.5) are the contract Phase 3 renders — don't rename or reshape tools after they're set.
**CopilotKit ↔ Mastra:** Use the AG-UI protocol via `registerCopilotKit` + `@ag-ui/mastra`. See `CLAUDE.md` integration section.

### Phase 3 Agent — Frontend & Generative UI
**Scope:** `docs/03-frontend-and-generative-ui.md` + `docs/README.md §3` + `designsystem.md`
**Works in:** `app/` only
**Goal:** Toronto map with heatmap/hotspot/risk overlays, CopilotKit chat that renders generative UI (charts + map highlights) from agent tool calls, `/dashboard` operations view.
**Key constraint:** Build against Phase 0 mock data + Phase 2 tool output shapes (§3.5). Do not wait for Phase 1/2 code — build against the frozen signatures.
**Design rules:** Dark mode default. Tailwind v4 CSS-first. shadcn/ui mandatory for standard elements. `motion/react` for animations (not `framer-motion`).

### Phase 4 Agent — Polish & Submission
**Scope:** `docs/04-polish-and-submission.md` + `prd.md §8, §9, §11, §12`
**Works in:** entire repo (hardening + docs)
**Goal:** Golden path bulletproof, RAPIDS benchmark captured on Spark, README complete, demo video recorded, submission package ready.
**Prerequisite:** Phases 1–3 must be complete and golden path must run end-to-end.

---

## Contracts Reference (§3 summary)

### §3.2 — Core Types (TypeScript, in `packages/contracts/src/index.ts`)
`Ward` · `ServiceRequest` · `DailyAggregate` · `Forecast` · `Hotspot` · `RiskScore` · `PipelineRun`
All types are derived from Zod schemas. Import from `@311pulse/contracts` — never redefine locally.

### §3.3 — Pipeline Artifacts (7 files, schemas frozen)
| File | Type |
|---|---|
| `wards.json` | `Ward[]` |
| `daily_aggregates.parquet` | `DailyAggregate[]` |
| `forecasts.json` | `Forecast[]` |
| `hotspots.json` | `Hotspot[]` |
| `risk_scores.json` | `RiskScore[]` |
| `request_summaries.json` | `{ category, wardId, period, summary }[]` |
| `pipeline_run.json` | `PipelineRun` |

### §3.4 — Convex Query Signatures (Phase 2 implements, Phase 3 consumes)
```ts
listWards(): Ward[]
getDailyAggregates({ wardId?, category?, from?, to? }): DailyAggregate[]
getForecast({ wardId?, category? }): Forecast[]
getHotspots({ category? }): Hotspot[]
getRiskScores({ wardId? }): RiskScore[]
searchSummaries({ query, limit? }): { category, wardId, period, summary }[]
getPipelineRun(): PipelineRun | null
importArtifacts({ ... }): { ok: true }
```

### §3.5 — Mastra Agent Tool Signatures (Phase 2 defines, Phase 3 UI keys off names)
| Tool | Input | Output | Generative UI triggered |
|---|---|---|---|
| `queryRequests` | `{ category?, wardId?, from?, to? }` | `DailyAggregate[]` | trend line chart |
| `getForecast` | `{ category?, wardId? }` | `Forecast[]` | bar chart + map highlight |
| `getHotspots` | `{ category? }` | `Hotspot[]` | map heat layer |
| `getRiskScore` | `{ wardId? }` | `RiskScore[]` | risk panel / choropleth |
| `simulateWeather` | `{ scenario, category? }` | `Forecast[]` | before/after chart (nice-to-have) |

### §3.6 — Required Environment Variables
`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `LLM_PROVIDER`, `NIM_BASE_URL`, `NIM_API_KEY`, `NIM_MODEL`, `FALLBACK_BASE_URL`, `FALLBACK_API_KEY`, `FALLBACK_MODEL`, `NEXT_PUBLIC_COPILOTKIT_URL`, `PIPELINE_ENGINE`

### §3.7 — LLM Abstraction
`agent/llm.ts` is the **only** file that constructs an LLM client. Both NIM and fallback use the OpenAI Chat Completions API. No other file creates an LLM client.

---

## Self-Test Checklist (run before reporting a phase complete)

### Foundations (Phase 0)
```bash
npm run typecheck && npm run lint
python -m pipeline.src.mock && ls pipeline/artifacts   # 7 files
npm run import
npx convex run queries:getForecast '{}'
npm run dev   # manual: header + panes + chat visible
```

### Data Pipeline (Phase 1)
```bash
python -m pipeline.src.run --sample 50000 --engine pandas
python -m pipeline.src.validate
python -m pipeline.src.run --sample 50000 --engine polars
cat pipeline/artifacts/pipeline_run.json
npm run import
```

### Backend & Agent (Phase 2)
```bash
npx convex run queries:getForecast '{"category":"pothole"}'
node agent/scripts/smoke-llm.mjs
node agent/scripts/smoke-agent.mjs "Which wards see most potholes next week?"
LLM_PROVIDER=fallback node agent/scripts/smoke-llm.mjs
npm run dev   # manual: ask the 3 golden-path questions in chat
```

### Frontend & Generative UI (Phase 3)
```bash
npm run typecheck && npm run lint
npm run dev
# Manual checklist:
# ✓ Map loads + heat layer toggles by category
# ✓ "Which wards will see the most pothole complaints next week?" → ForecastBarChart in chat + map highlight
# ✓ "Show garbage complaints vs heavy rain in Scarborough last year" → TrendLineChart
# ✓ "Is my neighbourhood at risk for flooding this weekend?" → RiskPanel
# ✓ /dashboard shows all widgets + benchmark stat
```

### Polish & Submission (Phase 4)
```bash
cp .env.example .env   # fill values
npx convex dev &
python -m pipeline.src.run --sample 50000 && npm run import
npm run dev   # golden path runs end-to-end
```

---

## The Golden Path (demo-critical — every agent protects this)

This thin vertical slice must work above everything else:

1. User opens app → Toronto map + forecast/risk panel visible.
2. User asks: *"Which wards will see the most pothole complaints next week?"*
3. Mastra agent reasons → calls `getForecast` → Convex returns ranked wards.
4. UI renders `ForecastBarChart` **in chat** + highlights top wards **on the map**.
5. Agent recommends: "pre-position crews in Ward X, Y".
6. Follow-up *"Why?"* → agent cites weather correlation data.

If a task would break or delay this path, it is lower priority.

---

## Handling Blockers

**Blocked on a contract ambiguity:** Update `docs/README.md §3`, call it out, continue with the updated contract.

**Blocked on another phase not being done:** Use the mock artifacts / Phase 0 stubs. Every phase is designed to build in isolation against mocks.

**Blocked on NIM / Nemotron unavailability:** Use `LLM_PROVIDER=fallback`. The LLM abstraction exists for exactly this.

**Blocked on RAPIDS not available on Mac:** Use `PIPELINE_ENGINE=pandas` or `polars`. RAPIDS is for the Spark only.

**Blocked on the Spark being unavailable:** Document the commands that would run on the Spark. Use Mac numbers clearly labeled as sampled/CPU baseline. Never fabricate benchmark figures.

---

## What Agents Must Never Do

- Change a contract in `docs/README.md §3` without flagging it first.
- Construct an LLM client outside `agent/llm.ts`.
- Define `Ward`, `Forecast`, or other shared types locally — import from `@311pulse/contracts`.
- Hard-code hex colors in components — use CSS variables.
- Import `framer-motion` — use `motion/react`.
- Fabricate RAPIDS benchmark numbers.
- Add features not in the phase doc (auth, multi-tenancy, live ingestion, mobile apps).
- Commit `.env`, `pipeline/artifacts/`, or `.next`.
- Claim a phase complete without running the self-test commands and capturing output.
- Read multiple phase files when dispatched to one phase — it causes over-engineering.

---

## Key File Quick Reference

| What you need | Where to look |
|---|---|
| Vision + architecture | `prd.md` |
| Shared contracts (types, schemas, signatures) | `docs/README.md §3` |
| UI design rules + color palette | `designsystem.md` |
| Tech stack + commands + conventions | `CLAUDE.md` |
| Phase 0 tasks (skeleton) | `docs/00-foundations.md` |
| Phase 1 tasks (pipeline) | `docs/01-data-pipeline.md` |
| Phase 2 tasks (backend + agent) | `docs/02-backend-and-agent.md` |
| Phase 3 tasks (frontend + gen UI) | `docs/03-frontend-and-generative-ui.md` |
| Phase 4 tasks (polish + submit) | `docs/04-polish-and-submission.md` |
| CopilotKit + Mastra AG-UI integration | https://mastra.ai/guides/build-your-ui/copilotkit |
