# Phase 2 — Backend & Agent (Convex + Mastra + Nemotron + CopilotKit)

---
## 📊 Progress Tracker

| | |
|---|---|
| **Status** | 🟡 In Progress |
| **Completion** | `████████████░░` 87% |
| **Last Updated** | 2026-05-30 |
| **Blocker** | None — Convex deployed at `wry-mandrill-452.convex.cloud` ✅ |

### ✅ Completed
- `convex/schema.ts` — all 7 tables with correct indexes (Phase 0)
- `convex/queries.ts` — all §3.4 queries with real filtering (`listWards`, `getDailyAggregates`, `getForecast`, `getHotspots`, `getRiskScores`, `searchSummaries`, `getPipelineRun`)
- `convex/mutations.ts` — `importArtifacts` mutation (idempotent upsert)
- `convex/seed.ts` — `seedMockData` internal mutation with Toronto mock data
- `agent/llm.ts` — LLM provider abstraction (`getLLM`, `isNim`, `setupMastraEnv`, `healthcheck`)
- `agent/convexClient.ts` — Convex HTTP client singleton
- `agent/tools/getForecast.ts` — Mastra tool → `getForecast` Convex query
- `agent/tools/queryRequests.ts` — Mastra tool → `getDailyAggregates` Convex query
- `agent/tools/getHotspots.ts` — Mastra tool → `getHotspots` Convex query
- `agent/tools/getRiskScore.ts` — Mastra tool → `getRiskScores` Convex query
- `agent/tools/simulateWeather.ts` — scenario simulation stub (scales forecasts)
- `agent/index.ts` — Mastra agent with all 5 tools, system prompt, NIM config
- `agent/vitest.config.ts` + 15 passing tests (llm, getForecast, queryRequests)
- `agent/scripts/smoke-llm.mjs` — LLM round-trip smoke test
- `agent/scripts/smoke-agent.mjs` — full agent tool-call smoke test
- `app/app/api/copilotkit/route.ts` — CopilotKit runtime with 4 server-side actions (getForecast, queryRequests, getHotspots, getRiskScore) + NIM/fallback OpenAI adapter
- `npm run test:run` — 15/15 tests passing ✅
- `npm run typecheck` — agent + app pass clean ✅

### ⏳ To Do
- Deploy Convex schema to prod (`npx convex dev` — needs user auth to push schema)
- Seed or import mock data so queries return data in production
- Run smoke tests against live NIM/fallback endpoint (needs .env with API keys)
- Verify fallback path: `LLM_PROVIDER=fallback node agent/scripts/smoke-llm.mjs`

### 🔑 Next Action
Seed Convex with mock data (`npx convex run seed:seedMockData`) and run smoke tests

---

> **Goal:** Make the data queryable (Convex), give the **Mastra agent** real tools over that data, wire **Nemotron via NIM** (with fallback) through the LLM abstraction, and connect it all to the UI through the **CopilotKit runtime**. This is where the "agentic" half of the demo comes alive.

**Owner agent scope:** Read this file + `docs/README.md` §3 (contracts §3.2, §3.4, §3.5, §3.6, §3.7). Build against the **mock artifacts from Phase 0** (already in Convex) — you do not need Phase 1 finished. Honor every signature in §3.4 and §3.5 exactly; Phase 3's UI keys off them.

**Outcome:** A user message in the CopilotKit chat reaches the Mastra agent, which calls a Convex-backed tool and returns structured results the UI can render. Nemotron is primary; fallback works if NIM is down.

---

## 0. Inputs
- Convex schema + query stubs (Phase 0).
- Mock or real artifacts already imported into Convex.
- `agent/llm.ts` LLM abstraction (Phase 0).
- Tool contract §3.5, query contract §3.4.

## 1. Convex — real queries & import

### 1.1 Implement queries (§3.4)
- [ ] `listWards`, `getDailyAggregates`, `getForecast`, `getHotspots`, `getRiskScores`, `searchSummaries`, `getPipelineRun` — implement with the indexes from Phase 0.
- [ ] `getDailyAggregates` filters by optional `wardId`, `category`, `from`, `to` using `by_ward_category` / `by_date` indexes.
- [ ] `searchSummaries`: simple keyword/substring match over `summaries` for v1 (vector search optional later).

```ts
// convex/queries.ts (excerpt)
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getForecast = query({
  args: { wardId: v.optional(v.string()), category: v.optional(v.string()) },
  handler: async (ctx, { wardId, category }) => {
    let rows = await ctx.db.query("forecasts").collect();
    if (wardId) rows = rows.filter(r => r.wardId === wardId);
    if (category) rows = rows.filter(r => r.category === category);
    return rows.sort((a,b) => b.predictedCount - a.predictedCount);
  },
});
```

### 1.2 Import mutation (§3.4)
- [ ] Implement `importArtifacts` (or per-table mutations) used by `scripts/import-artifacts.ts`. Validate with `@311pulse/contracts` Zod before insert. Make it idempotent (clear table or upsert).

## 2. LLM provider — Nemotron via NIM (+ fallback)
- [ ] In `agent/llm.ts`, finalize the OpenAI-compatible client per §3.7. Both NIM and fallback use Chat Completions.
- [ ] **NIM local:** base URL like `http://localhost:8000/v1`, model `NIM_MODEL` (a Nemotron model). **NIM hosted:** NVIDIA's OpenAI-compatible endpoint + `NIM_API_KEY`.
- [ ] Add a `healthcheck()` that pings the chosen provider; on failure and `LLM_PROVIDER=nim`, log and (optionally) auto-switch to fallback so the demo never dies.
- [ ] Add `agent/llm.test` style smoke check: one tiny completion round-trip.

## 3. Mastra agent + tools

### 3.1 Tools (§3.5) — each wraps a Convex query
- [ ] `queryRequests` → `getDailyAggregates`
- [ ] `getForecast` → `getForecast`
- [ ] `getHotspots` → `getHotspots`
- [ ] `getRiskScore` → `getRiskScores`
- [ ] `simulateWeather` (nice-to-have) → recompute/scale forecast for a scenario; stub returning adjusted `Forecast[]` is acceptable.
- [ ] Each tool: Zod input schema (from contracts), calls Convex via the Convex client, returns the **exact output shape** in §3.5. Tools must be pure data — formatting/visualization happens in the UI.

```ts
// agent/tools/getForecast.ts (excerpt)
import { createTool } from "@mastra/core";
import { z } from "zod";
import { convex } from "../convexClient";
import { api } from "../../convex/_generated/api";

export const getForecastTool = createTool({
  id: "getForecast",
  description: "Predicted 311 request counts per ward for a category over the next 7 days. Use for 'which wards will see most X next week' questions.",
  inputSchema: z.object({ wardId: z.string().optional(), category: z.string().optional() }),
  execute: async ({ context }) => {
    return await convex.query(api.queries.getForecast, {
      wardId: context.wardId, category: context.category,
    });
  },
});
```

### 3.2 Agent definition
- [ ] In `agent/index.ts`, create the Mastra agent with: the LLM from `getLLM()`/`MODEL`, all tools registered, memory enabled, and a **system prompt** that:
  - Explains it's a Toronto 311 operations assistant.
  - Lists when to use each tool (map the §3 user stories to tools).
  - Instructs it to always cite `drivers`/data when recommending actions and to be concise.
- [ ] Verify multi-step reasoning: a question triggers tool call(s) → synthesizes an answer.

## 4. CopilotKit runtime ↔ Mastra (via AG-UI protocol)
- [ ] CopilotKit + Mastra now integrate via the **AG-UI protocol**. In the Mastra agent config, call `registerCopilotKit({ path: "/copilotkit", resourceId: "<agent-id>" })` to expose the agent over the AG-UI event stream.
- [ ] Finalize `app/app/api/copilotkit/route.ts` to wire CopilotKit's runtime to the Mastra AG-UI endpoint. Use `@ag-ui/mastra` to connect — see [Mastra CopilotKit guide](https://mastra.ai/guides/build-your-ui/copilotkit) for the exact handler pattern.
- [ ] Ensure tool calls and their results are streamed to the client so Phase 3 can render generative UI from them.
- [ ] Confirm the chat in the existing UI shell now produces real, tool-grounded answers.

## 5. Reliability
- [ ] If a tool errors (e.g. empty data), return a structured empty result + message, never throw to the user.
- [ ] LLM fallback path verified by temporarily setting `LLM_PROVIDER=fallback`.
- [ ] Convex queries handle empty tables gracefully (pre-Phase-1 mock state).

## 6. Acceptance Criteria
- [ ] All §3.4 queries return correct data from Convex (mock or real).
- [ ] `npm run import` loads artifacts and validates them via Zod.
- [ ] LLM smoke test completes against NIM **and** against fallback (whichever is configured).
- [ ] In chat, "Which wards will see the most pothole complaints next week?" triggers `getForecast` and returns a ranked, data-grounded answer.
- [ ] "Show garbage complaints in Scarborough correlated with rain last year" triggers `queryRequests` and references weather.
- [ ] Tool outputs match §3.5 shapes exactly (Phase 3 contract).
- [ ] Forcing an LLM provider failure falls back without crashing the chat.

## 7. Self-Test (capture output)
```bash
npx convex run queries:getForecast '{"category":"pothole"}'   # ranked rows
node agent/scripts/smoke-llm.mjs                              # tiny completion ok
node agent/scripts/smoke-agent.mjs "Which wards see most potholes next week?"  # tool call + answer
LLM_PROVIDER=fallback node agent/scripts/smoke-llm.mjs        # fallback ok
npm run dev   # manual: ask the 3 golden-path questions in chat
```

## 8. Handoff
- Tools + their output shapes (§3.5) are the contract Phase 3 renders. Don't change names/shapes after this.
- Streaming of tool results is in place → Phase 3 wires `useCopilotAction` / generative components to those tool events.
