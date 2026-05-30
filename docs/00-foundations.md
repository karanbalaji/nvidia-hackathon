# Phase 0 — Foundations

> **Goal:** Stand up the entire skeleton — repo, all tooling, the **shared contracts**, env config, and runnable-but-empty versions of every part — so Phases 1–3 can be built independently and in parallel. **Mock data ships here** so nothing downstream is blocked on real processing.

**Owner agent scope:** Read this file + `docs/README.md` §3 (contracts). Do not build features — build the frame and freeze the contracts.

**Outcome:** `npm run dev` serves a Next.js app that connects to Convex (with mock data) and shows a "311 Pulse" shell. The Python pipeline package imports and runs a no-op that writes mock artifacts. The agent package compiles. CI/lint pass.

---

## 0. Prerequisites
- Node 20+, npm (or pnpm), Python 3.11+, `uv` (preferred) or venv.
- macOS dev machine. Everything here is CPU-only and Spark-agnostic.

## 1. Tasks

### 1.1 Initialize the Next.js app
- [ ] `npx create-next-app@latest app --ts --app --tailwind --eslint --src-dir=false` (App Router, TypeScript, Tailwind).
- [ ] Add **shadcn/ui**: `npx shadcn@latest init`; add `button card input dialog tabs badge skeleton sonner`.
- [ ] Install: `recharts date-fns lucide-react zod sonner`.
- [ ] Create a top-level shell layout: header "311 Pulse", a two-pane layout placeholder (map area left, chat area right), and a dashboard route stub at `/dashboard`.

### 1.2 Shared contracts package (the spine) 🔒
- [ ] Create `packages/contracts/` with `package.json` (name `@311pulse/contracts`) and `src/index.ts`.
- [ ] Implement **exactly** the types in `docs/README.md` §3.2 (`Ward`, `ServiceRequest`, `DailyAggregate`, `Forecast`, `Hotspot`, `RiskScore`, `PipelineRun`).
- [ ] For each type, also export a matching **Zod schema** (`WardSchema`, etc.) and an array schema. Derive TS types from Zod (`z.infer`) so they can't drift.
- [ ] Wire it as a workspace dependency consumable by `app/`, `convex/`, `agent/`. (npm/pnpm workspaces, or a simple path import if single-package.)

```ts
// packages/contracts/src/index.ts (excerpt — implement all of §3.2)
import { z } from "zod";

export const WardSchema = z.object({
  wardId: z.string(),
  wardName: z.string(),
  neighbourhoods: z.array(z.string()),
});
export type Ward = z.infer<typeof WardSchema>;

export const DailyAggregateSchema = z.object({
  date: z.string(),
  wardId: z.string(),
  category: z.string(),
  count: z.number(),
  tempC: z.number().nullable(),
  precipMm: z.number().nullable(),
});
export type DailyAggregate = z.infer<typeof DailyAggregateSchema>;

export const ForecastSchema = z.object({
  wardId: z.string(),
  category: z.string(),
  horizonStart: z.string(),
  horizonEnd: z.string(),
  predictedCount: z.number(),
  confidenceLow: z.number(),
  confidenceHigh: z.number(),
  method: z.string(),
});
export type Forecast = z.infer<typeof ForecastSchema>;
// ...Hotspot, RiskScore, ServiceRequest, PipelineRun likewise
```

### 1.3 Convex setup (schema skeleton + mock data)
- [ ] `npm create convex` (or `npx convex dev`) inside the project; creates `convex/`.
- [ ] Implement `convex/schema.ts` tables mirroring the contract: `wards`, `dailyAggregates`, `forecasts`, `hotspots`, `riskScores`, `summaries`, `pipelineRuns`. Add indexes used by §3.4 (`by_ward`, `by_category`, `by_ward_category`, `by_date`).
- [ ] Stub all query functions from §3.4 returning data from the tables (empty is fine now).
- [ ] Add a `convex/seed.ts` internal mutation that loads the **mock artifacts** (task 1.6) so the UI has something to render before Phase 1.

```ts
// convex/schema.ts (excerpt)
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  dailyAggregates: defineTable({
    date: v.string(), wardId: v.string(), category: v.string(),
    count: v.number(), tempC: v.union(v.number(), v.null()), precipMm: v.union(v.number(), v.null()),
  }).index("by_ward_category", ["wardId", "category"]).index("by_date", ["date"]),
  forecasts: defineTable({
    wardId: v.string(), category: v.string(), horizonStart: v.string(), horizonEnd: v.string(),
    predictedCount: v.number(), confidenceLow: v.number(), confidenceHigh: v.number(), method: v.string(),
  }).index("by_ward", ["wardId"]).index("by_category", ["category"]),
  // wards, hotspots, riskScores, summaries, pipelineRuns ...
});
```

### 1.4 Agent package skeleton + LLM abstraction
- [ ] Create `agent/` with `package.json`. Install `@mastra/core @mastra/client-js` (and Mastra deps) + an OpenAI-compatible client (`openai` or `@ai-sdk/openai`). `@mastra/client-js` is required for the AG-UI / CopilotKit integration in Phase 2.
- [ ] Implement `agent/llm.ts` per §3.7: read `LLM_PROVIDER` and return a configured OpenAI-compatible client (NIM base URL/key/model, or fallback). **This is the only place a client is constructed.**
- [ ] Create `agent/index.ts` that defines a Mastra agent with an empty tool set and a system prompt placeholder. It must **compile and instantiate** (no real tools yet — those are Phase 2).
- [ ] Create `agent/tools/` with one trivial `ping` tool to prove the wiring.

```ts
// agent/llm.ts
import OpenAI from "openai";
export function getLLM() {
  const useNim = (process.env.LLM_PROVIDER ?? "nim") === "nim";
  return new OpenAI({
    baseURL: useNim ? process.env.NIM_BASE_URL : process.env.FALLBACK_BASE_URL,
    apiKey: (useNim ? process.env.NIM_API_KEY : process.env.FALLBACK_API_KEY) ?? "not-needed",
  });
}
export const MODEL = (process.env.LLM_PROVIDER ?? "nim") === "nim"
  ? process.env.NIM_MODEL! : process.env.FALLBACK_MODEL!;
```

### 1.5 CopilotKit runtime skeleton
- [ ] Install `@copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime @ag-ui/mastra @ag-ui/core @ag-ui/client`. CopilotKit now integrates with Mastra via the **AG-UI protocol** — these packages are needed for Phase 2 wiring.
- [ ] Add API route `app/app/api/copilotkit/route.ts` wiring the CopilotKit runtime (Phase 2 connects it to Mastra via `registerCopilotKit`; for now a no-op/echo handler is fine).
- [ ] Wrap the app in `<CopilotKit runtimeUrl={NEXT_PUBLIC_COPILOTKIT_URL}>` and drop a `<CopilotChat />` in the right pane. It should render and accept input (even if it echoes).

### 1.6 Python pipeline package + engine abstraction + MOCK ARTIFACTS
- [ ] Create `pipeline/` with `pyproject.toml` (deps: `pandas polars duckdb pyarrow requests python-dotenv`; RAPIDS deps are **optional/extra**, not required to install).
- [ ] Implement `pipeline/src/engine.py`: an abstraction exposing `read_csv`, `groupby_agg`, `to_parquet`, etc., dispatching on `PIPELINE_ENGINE` (pandas/polars/duckdb now; `rapids`→cuDF branch stubbed with a clear `ImportError` guard).
- [ ] Implement `pipeline/src/mock.py` that writes schema-valid **mock artifacts** to `pipeline/artifacts/` for: `wards.json`, `daily_aggregates.parquet`, `forecasts.json`, `hotspots.json`, `risk_scores.json`, `request_summaries.json`, `pipeline_run.json` (per §3.3). Use ~3 wards, 2 categories (`pothole`, `flooding`), ~30 days.
- [ ] `python -m pipeline.src.mock` must produce all 7 files.

```python
# pipeline/src/engine.py (excerpt)
import os
ENGINE = os.getenv("PIPELINE_ENGINE", "pandas")

def get_engine():
    if ENGINE == "rapids":
        try:
            import cudf  # noqa
            return "rapids"
        except ImportError:
            raise RuntimeError("PIPELINE_ENGINE=rapids but cuDF not installed (run on Spark).")
    return ENGINE  # pandas | polars | duckdb
```

### 1.7 Import script (artifacts → Convex), stubbed
- [ ] Create `scripts/import-artifacts.ts`: reads files from `pipeline/artifacts/`, validates each with the Zod schemas from `@311pulse/contracts`, and calls Convex `importArtifacts` mutation (or per-table mutations). Wire it to the **mock artifacts** now so the loop works end-to-end before real data exists.
- [ ] `npm run import` runs it.

### 1.8 Env, config, hygiene
- [ ] Create `.env.example` with **exactly** the keys in §3.6. Add `.env` to `.gitignore`.
- [ ] Gitignore: `node_modules`, `.next`, `pipeline/artifacts/`, `.env*`, `__pycache__`, `.venv`.
- [ ] Add root `package.json` scripts: `dev`, `convex` (convex dev), `import`, `lint`, `typecheck`.
- [ ] Initialize git, first commit.
- [ ] Create a `README.md` stub (real one in Phase 4) with quickstart.

## 2. Acceptance Criteria
- [ ] `npm run dev` serves the app; header reads "311 Pulse"; map pane + chat pane visible; `/dashboard` route loads.
- [ ] `npx convex dev` runs; schema deploys; `seed` loads mock data; a query (e.g. `getForecast`) returns mock rows.
- [ ] `<CopilotChat />` renders and accepts input.
- [ ] `@311pulse/contracts` builds and is imported by app, convex, and agent without type errors.
- [ ] `agent/` compiles; `getLLM()` returns a client for both `LLM_PROVIDER=nim` and `=fallback` (no network call required to pass).
- [ ] `python -m pipeline.src.mock` writes all 7 artifacts matching §3.3 schemas.
- [ ] `npm run import` loads mock artifacts into Convex and the UI reflects them.
- [ ] `npm run typecheck` and `npm run lint` pass.

## 3. Self-Test (capture output)
```bash
npm run typecheck && npm run lint
python -m pipeline.src.mock && ls pipeline/artifacts        # expect 7 files
npm run import                                               # expect "imported N rows"
npx convex run queries:getForecast '{}'                      # expect mock forecast rows
npm run dev                                                  # manual: panes + chat render
```

## 4. Handoff Notes for Later Phases
- Contracts are now frozen in `packages/contracts` and `docs/README.md` §3. Phases 1–3 import from there.
- Mock artifacts exist → Phase 2 and Phase 3 can build against real Convex queries immediately.
- `agent/llm.ts` is the single LLM entry point → Phase 2 adds tools + system prompt only.
