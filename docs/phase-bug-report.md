# 311 Pulse — UI & Backend Bug Report
**Tested:** 2026-05-30 | **Tester:** GitHub Copilot (agent-browser sweep)  
**App URL:** http://localhost:3000 | **Status:** 🔴 Golden path broken

---

## Summary

| Severity | Count | Blocking golden path? |
|---|---|---|
| 🔴 CRITICAL | 3 | Yes — all 3 block the golden path |
| 🟡 MEDIUM | 3 | Degraded UX, partial data loss |
| 🟢 LOW | 3 | Cosmetic / non-functional stubs |

---

## 🔴 CRITICAL BUGS

---

### BUG-01 — `useCopilotChatHeadless_c` is a premium-only CopilotKit feature

**File:** `app/components/chat/pulse-chat.tsx` line 5  
**Symptom:** A CopilotKit paywall banner appears inside the chat panel:
> *"You're using useCopilotChatHeadless_c, a premium-only feature, which offers extensive headless chat capabilities. To continue, you'll need to provide a free public license key."*

The `sendMessage` function extracted from this hook (used by the Suggested Queries buttons) silently fails — clicking any suggested query does nothing.

**Root cause:**
```ts
// BROKEN — premium-only:
import { useCopilotChatHeadless_c } from "@copilotkit/react-core";
const { sendMessage } = useCopilotChatHeadless_c();
```

**Fix:** Replace with the free `useCopilotChat` hook which provides `appendMessage`:
```ts
// FREE — replace with:
import { useCopilotChat } from "@copilotkit/react-core";
const { appendMessage } = useCopilotChat();
```
Then update the suggestion buttons to call `appendMessage({ role: "user", content: s })` instead of `sendMessage(...)`.

**Impact:** Suggested Queries panel is completely broken. Premium banner pollutes the UI. Chat is visually degraded.

---

### BUG-02 — All 4 generative UI CopilotKit actions are marked `available: "disabled"`

**File:** `app/components/copilot/copilot-actions.tsx` lines 18, 55, 97, 121  
**Symptom:** The agent calls tools correctly but nothing renders in the chat panel — no charts, no map highlights, no risk panels appear after any response.

**Root cause:**
```ts
// ALL 4 actions disabled:
useCopilotAction({ name: "getForecast",    available: "disabled", ... });
useCopilotAction({ name: "queryRequests",  available: "disabled", ... });
useCopilotAction({ name: "getHotspots",    available: "disabled", ... });
useCopilotAction({ name: "getRiskScore",   available: "disabled", ... });
```

The `available: "disabled"` flag tells CopilotKit to never invoke these render functions even when the agent triggers the matching tool call. The generative UI (ForecastBarChart, TrendLineChart, HotspotMapAction, RiskPanel) never mounts.

**Fix:** Remove `available: "disabled"` from all 4 actions (the default is `"enabled"`):
```ts
useCopilotAction({
  name: "getForecast",
  // available: "disabled",  ← DELETE this line
  description: "...",
  ...
```

**Impact:** This is the single biggest UX regression — the entire generative UI feature is silently off. The golden path demo **cannot work** until this is fixed.

---

### BUG-03 — `daily_aggregates` parquet never imported → Convex table is empty

**File:** `scripts/import-artifacts.ts` lines 60–65  
**Symptom:**
- `getDailyAggregates({})` returns `[]` (verified via `npx convex run`)
- Dashboard **Trend Widget** always shows: *"No request trends recorded in the last 30 days"*
- Agent's `queryRequests` tool returns empty arrays for all historical queries
- Golden path question *"Show garbage complaints vs heavy rain in Scarborough last year"* returns no data

**Root cause:** The import script explicitly skips the parquet file:
```ts
// scripts/import-artifacts.ts
// Note: daily_aggregates are large — imported separately in Phase 2 in batches.
// For Phase 0, we import everything except the big parquet file.
await client.mutation("mutations:importArtifacts", {
  wards, forecasts, hotspots, riskScores, summaries, pipelineRun,
  // dailyAggregates: ← NEVER PASSED
});
```

The Convex `importArtifacts` mutation also lacks a `dailyAggregates` argument entirely. The parquet file has **140,009 rows** spanning 2023-01-01 to 2026-04-30 with columns: `date`, `wardId`, `category`, `count`, `tempC`, `precipMm`.

**Fix (two-part):**

1. **Add `dailyAggregates` to the `importArtifacts` mutation** in `convex/mutations.ts`:
```ts
dailyAggregates: v.optional(v.array(v.object({
  date: v.string(),
  wardId: v.string(),
  category: v.string(),
  count: v.number(),
  tempC: v.union(v.number(), v.null()),
  precipMm: v.union(v.number(), v.null()),
}))),
```

2. **Add batched parquet import** in `scripts/import-artifacts.ts` using `parquetjs-lite` (or read via Python first and write a JSON cache):
```ts
// Batch import to avoid Convex 8MB mutation limit
const BATCH_SIZE = 1000;
for (let i = 0; i < dailyAggregates.length; i += BATCH_SIZE) {
  await client.mutation("mutations:importArtifacts", {
    dailyAggregates: dailyAggregates.slice(i, i + BATCH_SIZE),
  });
}
```
> **Note:** 140k rows at ~120 bytes each ≈ 17MB. Use batches of 500–1000 rows. The Convex free tier has a 1MB per mutation limit — tune batch size accordingly.

**Impact:** Historical trend chart broken. `queryRequests` tool unusable. Two of the three golden path questions cannot be answered with real data.

---

## 🟡 MEDIUM BUGS

---

### BUG-04 — TrendWidget passes `activeCategory` raw string without "all" → `undefined` guard

**File:** `app/components/dashboard/trend-widget.tsx` line 26  
**Symptom:** If user manually sets `activeCategory = "all"`, the Convex query receives `category: "all"` which filters for a category literally named "all" (no rows match).

**Root cause:**
```ts
// trend-widget.tsx — missing "all" guard:
const dailyData = useQuery(api.queries.getDailyAggregates, {
  category: activeCategory,   // passes "all" string
  from: thirtyDaysAgoStr,
});
```

Compare to `app/app/page.tsx` which correctly guards:
```ts
category: activeCategory === "all" ? undefined : activeCategory,
```

**Fix:**
```ts
category: activeCategory === "all" ? undefined : activeCategory,
```

**Note:** The default `activeCategory` is `"pothole"` (set in `ward-context.tsx`) so this bug is currently hidden, but will surface when a user clicks the "All" button on the dashboard.

---

### BUG-05 — Agent `llm.ts` tests: 3 failing (property name mismatch)

**File:** `agent/__tests__/llm.test.ts`  
**Test run output:** `3 failed | 26 passed (29)`

The tests check `cfg.id` but `getMastraModelConfig()` returns an object with property `modelId` (and `providerId`), not `id`. Tests also expect `"openai/"` prefix auto-injection for fallback models which is not implemented.

```
AssertionError: expected undefined to be 'nvidia/nemotron-70b-instruct'
  // cfg.id is undefined — actual key is cfg.modelId
```

**Fix options (choose one):**
- **Option A — Fix tests to match implementation:** Change `cfg.id` → `cfg.modelId` in the test file.
- **Option B — Fix implementation to match tests:** Return `{ id: modelId, ... }` from `getMastraModelConfig()` and also implement the `openai/` prefix injection for fallback models without a `/`.

Option B aligns with how Mastra constructs model objects (`{ id, url, apiKey }`).

---

### BUG-06 — Risk Widget always shows "other" category on the dashboard

**File:** `app/components/dashboard/risk-widget.tsx` + `convex/queries.ts`  
**Symptom:** The dashboard "Highest Predictive Risk" panel shows only wards with `category: "other"` regardless of the selected dashboard category. The top 5 risk scores in Convex are all `other`.

**Root cause (two layers):**
1. `getRiskScores` query only accepts `wardId` filter — no `category` filter
2. The pipeline produces risk scores where "other" category has the highest numeric scores (largest complaint volume)
3. `RiskWidget` does not pass `activeCategory` to the query

**Observed in Convex:**
```
ward-03  other  62  ['above-baseline request volume']
ward-12  other  61  ['rising 14-day trend', 'above-baseline request volume']
ward-14  other  60  ['above-baseline request volume']
ward-10  other  59  ['above-baseline request volume']
```

**Fix:**
1. Update `getRiskScores` in `convex/queries.ts` to accept optional `category` filter
2. Pass `activeCategory !== "all" ? activeCategory : undefined` from `RiskWidget`

---

## 🟢 LOW / COSMETIC

---

### BUG-07 — Voice Query & Export Report buttons are non-functional stubs

**File:** `app/components/chat/pulse-chat.tsx` lines ~147–153  
**Symptom:** Clicking "Voice Query" or "Export Report" does nothing — no handler attached.

**Fix:** Either implement basic functionality or hide these buttons behind a `coming-soon` tooltip until implemented.

---

### BUG-08 — CopilotKit Inspector/Dev Tools modal appears in UI

**Symptom:** A CopilotKit developer inspector widget (with Threads link and Series A announcement) appears overlaid on the page. This is a development-mode overlay shipped by CopilotKit when a license key is absent.

**Fix:** Pass `COPILOTKIT_TELEMETRY_DISABLED=true` (already set in `app/.env.local`) — however this is also linked to **BUG-01** (premium feature usage). Fixing BUG-01 by removing `useCopilotChatHeadless_c` should suppress the inspector modal too.

---

### BUG-09 — Forecasts horizon is stale (May 2026 data, current date May 30 2026)

**Symptom:** The `getForecast` data shows `horizonStart: 2026-05-01` / `horizonEnd: 2026-05-07` — the forecast period is already in the past.

**Root cause:** Pipeline was run on ~2026-05-01 and has not been re-run. The forecast horizon is hardcoded relative to the pipeline run date.

**Fix:** Re-run the pipeline (`python3 -m pipeline.src.run --sample 50000`) and re-import artifacts (`npm run import`). Also consider making `ForecastBarChart` label the horizon relative to today rather than showing raw dates.

---

## Fix Priority Order

| Order | Bug | Effort | Impact |
|---|---|---|---|
| 1 | **BUG-02** — Enable CopilotKit actions (remove `available: "disabled"`) | 5 min | Unblocks entire generative UI |
| 2 | **BUG-01** — Replace `useCopilotChatHeadless_c` → `useCopilotChat` | 15 min | Fixes suggested queries + removes paywall banner |
| 3 | **BUG-03** — Import `daily_aggregates` into Convex | 1–2 hrs | Fixes trend chart + historical queries |
| 4 | **BUG-05** — Fix agent `llm.ts` test failures | 10 min | Green CI |
| 5 | **BUG-04** — `activeCategory` guard in TrendWidget | 2 min | Prevents future regression |
| 6 | **BUG-06** — Risk Widget category filter | 20 min | Better dashboard data quality |
| 7 | **BUG-09** — Re-run pipeline for fresh forecasts | 5 min (run) | Stale data fix |
| 8 | **BUG-07, BUG-08** | Low | Cosmetic polish |

---

## Verified Working

- ✅ App loads at `http://localhost:3000` (200 OK)
- ✅ Toronto map renders with Leaflet tiles
- ✅ Wards GeoJSON API (`/api/wards-geojson`) returns 25 features
- ✅ Convex connected — `listWards`, `getForecast`, `getHotspots`, `getRiskScores` return real data
- ✅ Forecasts in Convex: 174 records across 7 categories × 25 wards
- ✅ Hotspots: 50 records
- ✅ Risk scores: 169 records
- ✅ Pipeline run metadata: `engine: pandas`, `rows: 1,437,916`, `duration: 4.95s`
- ✅ Benchmark widget on `/dashboard` renders correctly
- ✅ Hotspot Widget on `/dashboard` shows top 3 wards
- ✅ App TypeScript: zero type errors (`tsc --noEmit` passes)
- ✅ App lint: zero ESLint errors
- ✅ App tests: **25/25 passing**
- ✅ Pipeline tests: **39/39 passing**
- ✅ CopilotKit API endpoint responds at `/api/copilotkit` (POST)
- ✅ Navigation: Map / Dashboard / Wards / Alert Center / Settings links present
- ✅ Dark mode default rendering correctly
- ✅ Left sidebar category + layer toggles present
- ✅ Map controls (Heat / Hotspots / Risk / None) present

## Broken

- ❌ Agent tests: **3/29 failing** (`getMastraModelConfig` property mismatch)
- ❌ Suggested Queries buttons (BUG-01)
- ❌ Generative UI charts in chat (BUG-02)
- ❌ Trend Widget on Dashboard (BUG-03 — no daily_aggregates in Convex)
- ❌ Historical trend queries via agent `queryRequests` tool (BUG-03)
- ❌ Premium CopilotKit banner polluting chat UI (BUG-01)
