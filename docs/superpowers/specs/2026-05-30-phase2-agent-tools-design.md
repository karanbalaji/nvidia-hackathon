# Phase 2 — Mastra Agent Tools + CopilotKit Wiring

**Date:** 2026-05-30  
**Status:** Approved  
**Scope:** `agent/` workspace + `app/app/api/copilotkit/route.ts`

---

## 1. Goal

Make the 311 Pulse chat functional end-to-end: a message in the CopilotKit chat reaches the Mastra agent (Nemotron via NIM, fallback to OpenAI-compatible), triggers a real Convex query, and returns structured data the Phase 3 UI can render.

---

## 2. Architecture

### Integration pattern: in-process (Option A)

The Next.js CopilotKit route imports `mastra` directly from `@311pulse/agent` (workspace link). No separate server process needed.

```
Browser → POST /api/copilotkit
  → CopilotRuntime + ExperimentalEmptyAdapter
  → getLocalAgents({ mastra, resourceId: "311-pulse-agent" })
  → Mastra Agent (LLM via NIM or fallback)
    → tool call → ConvexHttpClient → wry-mandrill-452.convex.cloud
    ← typed result (Forecast[] | Hotspot[] | RiskScore[] | DailyAggregate[])
  ← AG-UI streamed events
← Phase 3 generative UI renders tool output
```

### Convex client

`agent/convexClient.ts` exports a singleton `ConvexHttpClient` reading `CONVEX_URL` (falls back to `NEXT_PUBLIC_CONVEX_URL`). Both env vars are set in `app/.env.local` and must be available at agent runtime.

---

## 3. Files

### New in `agent/`

| File | Purpose |
|---|---|
| `convexClient.ts` | Singleton `ConvexHttpClient`; throws at call time (not import time) if URL missing |
| `tools/getForecast.ts` | Tool: wraps `queries.getForecast` → `Forecast[]` sorted by `predictedCount` desc |
| `tools/getHotspots.ts` | Tool: wraps `queries.getHotspots` → `Hotspot[]` sorted by `intensity` desc |
| `tools/getRiskScore.ts` | Tool: wraps `queries.getRiskScores` → `RiskScore[]` sorted by `score` desc |
| `tools/queryRequests.ts` | Tool: wraps `queries.getDailyAggregates` → `DailyAggregate[]` sorted by `date` asc |
| `tools/simulateWeather.ts` | Stub: accepts `{ scenario: string, category?: string }`, scales last forecast by precip multiplier, returns `Forecast[]` |
| `vitest.config.ts` | Vitest node environment config |
| `tools/__tests__/getForecast.test.ts` | TDD tests (Convex mocked) |
| `tools/__tests__/getHotspots.test.ts` | TDD tests |
| `tools/__tests__/getRiskScore.test.ts` | TDD tests |
| `tools/__tests__/queryRequests.test.ts` | TDD tests |
| `tools/__tests__/simulateWeather.test.ts` | TDD tests |
| `__tests__/llm.test.ts` | Tests NIM vs fallback URL/model selection (no network) |
| `scripts/smoke-llm.mjs` | One-shot completion round-trip; exits 0 on success |
| `scripts/smoke-agent.mjs` | Full agent call: "Which wards see most potholes next week?" → must trigger `getForecast` tool |

### Modified

| File | Change |
|---|---|
| `agent/package.json` | Add `convex` to deps; add `vitest` + `@types/node` to devDeps; add `test` + `test:run` scripts |
| `agent/llm.ts` | Add `healthcheck(): Promise<boolean>` — pings `/models` or sends a minimal completion; logs warning on failure, returns `false` (never throws) |
| `agent/index.ts` | Register all 5 tools; replace stub system prompt with full Toronto 311 ops context + tool usage guide |
| `app/app/api/copilotkit/route.ts` | Replace `OpenAIAdapter` placeholder with `ExperimentalEmptyAdapter` + `getLocalAgents({ mastra, resourceId: "311-pulse-agent" })` |

---

## 4. Tool Contracts (§3.5)

Each tool follows this pattern:

```ts
createTool({
  id: "<toolName>",           // exact §3.5 name
  description: "...",         // LLM sees this — be specific about WHEN to use it
  inputSchema: z.object({...}),  // from contracts Zod schemas
  outputSchema: z.array(...),    // from contracts Zod schemas
  execute: async ({ context }) => {
    const result = await convex.query(api.queries.<fn>, context);
    return result ?? [];        // never throw — return empty array on failure
  },
})
```

### Tool descriptions (what the LLM sees)

- **getForecast**: "Predicted 311 request counts per ward for the next 7 days. Use when asked which wards will see the most X next week, or for planning/staffing questions."
- **getHotspots**: "Geographic clusters of 311 activity by category. Use when asked where complaints are concentrated, or to populate a map layer."
- **getRiskScore**: "Composite 0–100 risk score per ward with human-readable drivers. Use when asked which wards are at highest risk, or why a ward is flagged."
- **queryRequests**: "Historical daily aggregate counts by ward/category/date range. Use for trend analysis, year-over-year comparisons, or weather correlation questions."
- **simulateWeather**: "Simulate how a weather scenario (e.g. heavy rain) would affect 311 request counts. Use for 'what if' planning questions."

---

## 5. System Prompt

The agent prompt covers:
1. Role: Toronto 311 operations assistant for city planners, ward councillors, operations staff
2. Tool selection guide: one sentence per tool mapping question type → tool name
3. Answer style: cite ward IDs + data values; recommend specific actions; flag data limitations; be concise
4. Data context: data covers 2023–2025, 25 Toronto wards, 7 categories

---

## 6. Error Handling

- **Empty Convex result**: tools return `[]`, agent explains "no data found for those filters"
- **Convex unreachable**: `execute` catches, logs, returns `[]` with error metadata field
- **LLM failure**: `healthcheck()` returns `false` and logs warning; agent answers from context if possible
- **Missing `CONVEX_URL`**: `convexClient.ts` throws a clear error at first query call, not at import

---

## 7. Testing

### Unit (Vitest, `environment: "node"`)

Each tool test:
1. Mock `convexClient` module — replace `convex.query` with `vi.fn()` returning fixture data
2. **Red**: call `tool.execute({ context: {} })` → assert shape matches §3.5 schema
3. **Green**: implement tool
4. Cover: normal result, empty result, optional filter args

`llm.test.ts`:
- `LLM_PROVIDER=nim` → `getLLM().baseURL` is NIM URL, `MODEL` is NIM model
- `LLM_PROVIDER=fallback` → `getLLM().baseURL` is fallback URL, `MODEL` is fallback model

### Smoke (manual / CI)

```bash
node agent/scripts/smoke-llm.mjs                    # tiny completion → "pong" or similar
node agent/scripts/smoke-agent.mjs "Which wards..."  # getForecast triggered in output
LLM_PROVIDER=fallback node agent/scripts/smoke-llm.mjs
```

---

## 8. Acceptance Criteria

- [ ] `npm run test:run` passes (agent workspace) with zero failures
- [ ] `npx convex run queries:getForecast '{"category":"pothole"}'` returns ranked rows
- [ ] Smoke LLM: `node agent/scripts/smoke-llm.mjs` exits 0
- [ ] Smoke agent: response to pothole question mentions specific ward IDs from data
- [ ] `LLM_PROVIDER=fallback node agent/scripts/smoke-llm.mjs` exits 0
- [ ] CopilotKit chat in the app responds with data-grounded answers (not echoes)
- [ ] Tool outputs match §3.5 shapes (verified by outputSchema Zod parse in tests)
