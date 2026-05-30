# CLAUDE.md — 311 Pulse Project Guide

> This file is the first thing Claude Code reads. Follow it exactly. It overrides default behaviors.

## Project at a Glance

**311 Pulse** — a predictive, agentic intelligence system for Toronto's 311 service requests.
**Hackathon:** NVIDIA + City of Toronto (May 2026) · **Deadline:** Sun May 31, 11:00 AM
**Build environment:** macOS (dev, sampled data) + DGX Spark ASUS Ascent GX10 (full-scale GPU runs)
**Team size:** 2–4 people + AI agents working in parallel across phases

The single most important outcome: **the golden path works end-to-end** (see `prd.md` §9). Everything else is secondary.

---

## Tech Stack (verified May 2026)

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | Next.js (App Router) | **16.x** |
| UI runtime | React | **19.x** |
| Styling | Tailwind CSS | **v4** (CSS-first `@theme`, no `tailwind.config.js`) |
| Components | shadcn/ui (new-york style) + Radix UI | latest |
| Charts | Recharts | latest |
| Maps | Leaflet → react-leaflet (Mapbox GL if time) | latest |
| AI chat / Generative UI | CopilotKit | **1.58+** (`@copilotkit/react-core`, `@copilotkit/react-ui`, `@copilotkit/runtime`) |
| CopilotKit ↔ Mastra bridge | AG-UI Protocol | `@ag-ui/mastra`, `@ag-ui/core`, `@ag-ui/client` |
| Agent framework | Mastra | **@mastra/core 1.36+**, `@mastra/client-js` |
| Backend / DB | Convex | **1.39+** |
| LLM primary | NVIDIA Nemotron via NIM | OpenAI-compatible endpoint |
| LLM fallback | Any OpenAI-compatible provider | configured via env |
| Data processing | RAPIDS (cuDF/cuML/cuspatial) on Spark; pandas/Polars/DuckDB fallback | latest |
| Language (app/agent) | TypeScript strict mode | 5.x |
| Language (pipeline) | Python | 3.11+ |
| Package manager | npm (or pnpm) | — |
| Python env | `uv` (preferred) or venv | — |
| Animations | `motion/react` (formerly Framer Motion) | latest |
| Toasts | Sonner | latest |
| Validation | Zod | latest |
| Icons | Lucide React | latest |
| Theming | next-themes | latest · **dark mode default** |

---

## Repository Structure

```
nvidia-hackathon/
├─ CLAUDE.md               ← you are here
├─ AGENTS.md               ← agent dispatch rules
├─ prd.md                  ← vision + architecture (read-only reference)
├─ designsystem.md         ← UI design rules (agents building frontend MUST read)
├─ docs/
│  ├─ README.md            ← shared contracts §3 (THE LAW — frozen)
│  ├─ 00-foundations.md    ← Phase 0: repo skeleton, contracts, mock data
│  ├─ 01-data-pipeline.md  ← Phase 1: data ingestion + RAPIDS analytics
│  ├─ 02-backend-and-agent.md ← Phase 2: Convex + Mastra + NIM + CopilotKit
│  ├─ 03-frontend-and-generative-ui.md ← Phase 3: map, chat, generative UI
│  └─ 04-polish-and-submission.md ← Phase 4: hardening + README + video
├─ app/                    ← Next.js 16 App Router (created in Phase 0)
├─ convex/                 ← Convex schema + functions
├─ agent/                  ← Mastra agent + tools + LLM provider
├─ pipeline/               ← Python data pipeline
├─ packages/contracts/     ← SHARED TypeScript types + Zod schemas
├─ scripts/                ← import + dev scripts
└─ .env.example            ← all required env vars
```

---

## Essential Commands

```bash
# Development
npm run dev              # Next.js 16 dev server
npx convex dev           # Convex local dev + deploy

# Data pipeline
python -m pipeline.src.mock          # write mock artifacts (Phase 0)
python -m pipeline.src.run --sample 50000   # run real pipeline (Phase 1)
python -m pipeline.src.validate      # validate all 7 artifacts against schemas
PIPELINE_ENGINE=rapids python -m pipeline.src.run  # full run on Spark

# Import artifacts → Convex
npm run import           # reads pipeline/artifacts/, validates via Zod, loads into Convex

# Quality
npm run typecheck        # tsc --noEmit (must pass before claiming any phase done)
npm run lint             # ESLint (must pass)

# Convex queries (smoke test)
npx convex run queries:getForecast '{}'
npx convex run queries:getHotspots '{}'

# Agent smoke tests
node agent/scripts/smoke-llm.mjs                              # LLM round-trip
node agent/scripts/smoke-agent.mjs "Which wards see most potholes next week?"
LLM_PROVIDER=fallback node agent/scripts/smoke-llm.mjs       # fallback path
```

---

## Environment Variables

All keys live in `.env` (gitignored). Copy from `.env.example`:

```bash
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# LLM (primary = Nemotron via NIM; fallback = any OpenAI-compatible)
LLM_PROVIDER=nim
NIM_BASE_URL=http://localhost:8000/v1
NIM_API_KEY=
NIM_MODEL=nvidia/nemotron-...
FALLBACK_BASE_URL=
FALLBACK_API_KEY=
FALLBACK_MODEL=

# CopilotKit
NEXT_PUBLIC_COPILOTKIT_URL=/api/copilotkit

# Pipeline
PIPELINE_ENGINE=pandas     # pandas | polars | duckdb | rapids
```

**Never commit `.env`.** The `.env.example` must always be current.

---

## Phase Architecture — How to Build

The project is split into 5 self-contained phases. **Read only the phase file you own** (plus `docs/README.md` §3 for contracts). Do not read other phase files unless you're debugging an integration boundary.

| Phase | File | Can run in parallel? | Depends on |
|---|---|---|---|
| 0 — Foundations | `docs/00-foundations.md` | No — must land first | — |
| 1 — Data Pipeline | `docs/01-data-pipeline.md` | **Yes** (after Phase 0) | §3 contracts only |
| 2 — Backend & Agent | `docs/02-backend-and-agent.md` | **Yes** (after Phase 0) | §3 contracts + Phase 0 mock artifacts |
| 3 — Frontend & Generative UI | `docs/03-frontend-and-generative-ui.md` | **Yes** (after Phase 0) | §3 contracts + Phase 2 tool signatures |
| 4 — Polish & Submission | `docs/04-polish-and-submission.md` | No — needs 1–3 done | Golden path running |

**Phase 0 is the unlocker.** It freezes the contracts and ships mock data so Phases 1–3 can run in parallel without waiting on each other.

---

## The Shared Contracts — THE LAW 🔒

`docs/README.md §3` defines the shared contracts. **No phase may silently change anything in §3.** If a contract must change:
1. Update `docs/README.md §3` first.
2. Note which phases are affected.
3. Flag the change explicitly in your response.

Contracts include:
- **§3.2** — TypeScript types (`Ward`, `ServiceRequest`, `DailyAggregate`, `Forecast`, `Hotspot`, `RiskScore`, `PipelineRun`)
- **§3.3** — Artifact file names + schemas (7 files in `pipeline/artifacts/`)
- **§3.4** — Convex query/mutation signatures
- **§3.5** — Mastra agent tool names + input/output shapes (Phase 3 UI keys off these)
- **§3.6** — Environment variable names
- **§3.7** — LLM provider abstraction (`agent/llm.ts` is the single LLM entry point)

All TypeScript types live in `packages/contracts/src/index.ts`. Types are derived from Zod schemas (`z.infer`). Never duplicate a type locally — import from `@311pulse/contracts`.

---

## Code Conventions

### TypeScript
- **Strict mode everywhere** — `"strict": true` in tsconfig.
- Zod validates anything crossing a system boundary (API input, artifact import, tool input/output).
- Types flow from `@311pulse/contracts`. Never define a `Ward`, `Forecast`, etc. locally.
- `agent/llm.ts` is the **only** file that constructs an LLM client.

### Python
- `ruff` for linting + formatting.
- Type hints everywhere.
- All heavy data ops go through `pipeline/src/engine.py` (engine-agnostic interface).
- RAPIDS imports are **always** import-guarded:
  ```python
  try:
      import cudf as pd  # type: ignore
  except ImportError:
      import pandas as pd
  ```
- Never let a missing RAPIDS dependency crash the Mac dev path.

### General
- **YAGNI ruthlessly.** No future-proofing, no unused abstractions.
- No comments that describe what code does — only comments explaining non-obvious WHY (hidden constraints, workarounds).
- Commit per phase milestone.
- `pipeline/artifacts/`, `.env*`, `__pycache__`, `.venv`, `.next` are gitignored — never commit them.

---

## Design System (Frontend Agents)

Agents building frontend components **must** read `designsystem.md` before writing any UI code. Key rules:

- Dark mode is primary. The app ships dark by default.
- Tailwind v4: CSS-first config via `@theme` in CSS files. No `tailwind.config.js`.
- shadcn/ui components are **mandatory** for all standard UI elements — never roll custom buttons, inputs, dialogs.
- `motion/react` for animations (not `framer-motion` — that's the old import).
- Font: Lexend (primary) / JetBrains Mono (code/monospace).
- Color palette is defined in `designsystem.md §2`. Use CSS variables, never hardcode hex values.
- Map chrome: never leave default blue Leaflet chrome. Restyle to surface design tokens.

---

## CopilotKit + Mastra Integration (AG-UI Protocol)

CopilotKit integrates with Mastra via the **AG-UI protocol** (not a direct runtime bridge). Integration pattern:

**Backend (Mastra side):**
```ts
// In Mastra agent config
registerCopilotKit({ path: "/copilotkit", resourceId: "<agent-id>" })
```

**Frontend (CopilotKit side):**
```ts
// app/app/api/copilotkit/route.ts
// Use @ag-ui/mastra handler — see mastra.ai/guides/build-your-ui/copilotkit
```

**Key packages:**
- `@copilotkit/react-core`, `@copilotkit/react-ui`, `@copilotkit/runtime`
- `@ag-ui/mastra`, `@ag-ui/core`, `@ag-ui/client`
- `@mastra/core`, `@mastra/client-js`

Reference: https://mastra.ai/guides/build-your-ui/copilotkit

---

## The Golden Path — Protect Above All Else

This must work end-to-end before anything else is polished:

1. User opens app → Toronto map with 311 heatmap + forecast/risk panel.
2. User asks: *"Which wards will see the most pothole complaints next week?"*
3. Mastra agent (Nemotron) reasons → calls `getForecast` tool → Convex returns ranked wards.
4. UI renders a **generative** `ForecastBarChart` in chat + highlights those wards on the map.
5. Agent adds a recommendation ("pre-position crews in Ward X, Y").
6. Follow-up: *"Why those wards?"* → agent explains weather correlation.

**If a task competes with the golden path, protect the golden path.**

---

## The NVIDIA / DGX Spark Story

This is critical for judging (30 points). Key points:
- RAPIDS (cuDF/cuML/cuspatial) is the primary processing path on the Spark.
- The pipeline is **engine-agnostic**: same code runs on Mac (pandas/Polars) for dev, full-scale GPU on the Spark via `PIPELINE_ENGINE=rapids`.
- Nemotron runs **locally via NIM** on the Spark (privacy + low latency).
- Report the **measured** CPU-vs-GPU speedup — never invent numbers.
- The benchmark stat (rows processed, duration, engine) lives in `pipeline_run.json` and is surfaced on `/dashboard`.

---

## Parallelism — Multi-Agent Builds

When spawning subagents, give each agent **only its phase file + `docs/README.md §3`**. Use this dispatch template:

> "Build Phase N of 311 Pulse. Read `docs/0N-*.md` and `docs/README.md` (contracts §3) only. Implement every task, meet every acceptance criterion, and run the self-test commands at the bottom. Do not change any shared contract without flagging it. Report what passed/failed with command output."

Phases 1, 2, and 3 can run in parallel after Phase 0 completes. Never let a subagent read multiple phase files — it will over-engineer cross-phase concerns.

---

## What NOT to Do

- **Do not** change any contract in `docs/README.md §3` without flagging it — it breaks parallel phases.
- **Do not** construct an LLM client outside `agent/llm.ts`.
- **Do not** define `Ward`, `Forecast`, etc. types locally — import from `@311pulse/contracts`.
- **Do not** hard-code hex colors — use CSS variables from the design system.
- **Do not** install `framer-motion` — use `motion/react`.
- **Do not** fake benchmark numbers — measure and report what you observe.
- **Do not** commit `.env`, `pipeline/artifacts/`, or `.next`.
- **Do not** add auth, multi-tenancy, or live streaming ingestion — explicitly out of scope.
- **Do not** claim a phase is "done" until `npm run typecheck && npm run lint` pass and the self-test commands at the bottom of the phase doc run with captured output.

---

## Definition of Done (per phase)

A phase is done **only** when:
1. Every checkbox in the phase file's task list is checked.
2. Every acceptance criterion is met.
3. Self-test commands (bottom of the phase file) run and produce the expected output.
4. `npm run typecheck && npm run lint` pass (for app/agent phases).
5. `python -m pipeline.src.validate` passes (for pipeline phase).
