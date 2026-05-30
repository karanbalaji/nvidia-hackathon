# Phase 2 — Mastra Agent Tools + CopilotKit Wiring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire 5 Mastra tools (getForecast, getHotspots, getRiskScore, queryRequests, simulateWeather) against live Convex data and connect them to the CopilotKit chat via in-process import.

**Architecture:** The `agent/` workspace exports a `mastra` instance with all tools registered. The Next.js CopilotKit route imports `mastra` from `@311pulse/agent`, creates a `CopilotRuntime` with `getLocalAgents({ mastra, resourceId })` + `ExperimentalEmptyAdapter`, and streams AG-UI events to the browser. Each tool calls `ConvexHttpClient.query()` against the live deployment at `wry-mandrill-452.convex.cloud`.

**Tech Stack:** `@mastra/core` 1.37.1, `convex/browser` (ConvexHttpClient), `@ag-ui/mastra` (getLocalAgents), `@copilotkit/runtime` (CopilotRuntime, ExperimentalEmptyAdapter), Vitest (node env), `zod` v3.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `agent/package.json` | modify | add `convex` dep; add `vitest` devDep + test scripts |
| `agent/vitest.config.ts` | create | vitest node env config |
| `agent/convexClient.ts` | create | `ConvexHttpClient` singleton + `getConvexUrl()` |
| `agent/llm.ts` | modify | add `healthcheck(): Promise<boolean>` |
| `agent/tools/ping.ts` | modify | fix execute signature (was using old `{context}` pattern) |
| `agent/tools/getForecast.ts` | create | wraps `queries.getForecast` → `Forecast[]` |
| `agent/tools/getHotspots.ts` | create | wraps `queries.getHotspots` → `Hotspot[]` |
| `agent/tools/getRiskScore.ts` | create | wraps `queries.getRiskScores` → `RiskScore[]` |
| `agent/tools/queryRequests.ts` | create | wraps `queries.getDailyAggregates` → `DailyAggregate[]` |
| `agent/tools/simulateWeather.ts` | create | stub — scales last forecast by precip scenario |
| `agent/index.ts` | modify | register all 5 tools; real system prompt; OpenAICompatibleConfig model |
| `agent/__tests__/llm.test.ts` | create | TDD: NIM vs fallback URL/model selection |
| `agent/__tests__/convexClient.test.ts` | create | TDD: URL missing throws, URL present returns client |
| `agent/tools/__tests__/getForecast.test.ts` | create | TDD: mock Convex, verify output shape |
| `agent/tools/__tests__/getHotspots.test.ts` | create | TDD: mock Convex, verify output shape |
| `agent/tools/__tests__/getRiskScore.test.ts` | create | TDD: mock Convex, verify output shape |
| `agent/tools/__tests__/queryRequests.test.ts` | create | TDD: mock Convex, verify output shape |
| `agent/tools/__tests__/simulateWeather.test.ts` | create | TDD: stub returns scaled Forecast[] |
| `agent/scripts/smoke-llm.mjs` | create | one-shot completion round-trip |
| `agent/scripts/smoke-agent.mjs` | create | full agent call → getForecast triggered |
| `app/package.json` | modify | add `@311pulse/agent: "*"` dep |
| `app/app/api/copilotkit/route.ts` | modify | swap placeholder for Mastra wiring |

---

## Critical API Notes (read before coding)

### `createTool` execute signature (Mastra 1.37)
The `execute` function receives `(inputData, toolContext)` where `inputData` is the **validated Zod schema output** directly — NOT wrapped in `{ context }`. The old Phase 0 ping tool is WRONG:

```ts
// WRONG (old pattern)
execute: async ({ context }) => ({ pong: context.message })

// CORRECT (Mastra 1.37)
execute: async (inputData) => ({ pong: inputData.message ?? "pong" })
execute: async (inputData, toolCtx) => { /* toolCtx.mastra etc */ }
```

### `OpenAICompatibleConfig` model config (Mastra 1.37)
`MastraModelConfig` accepts `{ id: "${string}/${string}", url?: string, apiKey?: string }`:

```ts
// NIM
model: { id: "nvidia/nemotron-70b-instruct", url: "http://localhost:8000/v1", apiKey: "..." }
// Fallback
model: { id: "openai/gpt-4o-mini", apiKey: "..." }
```

### `getLocalAgents` duck-typing
`@ag-ui/mastra`'s `getLocalAgents` calls `mastra.listAgents()` with duck-typing. Works even if `mastra` and `@ag-ui/mastra` come from different module instances (both are `@mastra/core@1.37.1`).

### Convex import path
From `agent/tools/getForecast.ts` the generated API is: `../../convex/_generated/api.js` (relative). NodeNext requires `.js` extension for TS imports compiled to ESM.

---

## Task 1: Agent workspace setup

**Files:**
- Modify: `agent/package.json`
- Create: `agent/vitest.config.ts`

- [ ] **Step 1: Add convex + vitest to agent/package.json**

```json
{
  "name": "@311pulse/agent",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@mastra/core": "^1.36.0",
    "@mastra/client-js": "^1.21.0",
    "convex": "^1.39.1",
    "openai": "^4",
    "zod": "^3"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^22",
    "vitest": "^2"
  }
}
```

- [ ] **Step 2: Install from repo root**

```bash
npm install
```

Expected: `convex` and `vitest` appear in `agent/node_modules/`.

- [ ] **Step 3: Create agent/vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

- [ ] **Step 4: Add @311pulse/agent to app/package.json dependencies**

Open `app/package.json` and add to `"dependencies"`:

```json
"@311pulse/agent": "*"
```

- [ ] **Step 5: Re-run npm install from repo root**

```bash
npm install
```

Expected: `app/node_modules/@311pulse/agent` → symlink to `../../agent/`.

- [ ] **Step 6: Commit setup**

```bash
git add agent/package.json agent/vitest.config.ts app/package.json
git commit -m "feat: add convex+vitest to agent, link @311pulse/agent into app"
```

---

## Task 2: ConvexHttpClient singleton (TDD)

**Files:**
- Create: `agent/__tests__/convexClient.test.ts`
- Create: `agent/convexClient.ts`

- [ ] **Step 1: Write the failing test**

Create `agent/__tests__/convexClient.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("getConvexUrl", () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  it("throws when neither CONVEX_URL nor NEXT_PUBLIC_CONVEX_URL is set", async () => {
    delete (process.env as Record<string, unknown>).CONVEX_URL;
    delete (process.env as Record<string, unknown>).NEXT_PUBLIC_CONVEX_URL;
    // Re-import to get fresh read of env
    const mod = await import("../convexClient.js");
    expect(() => mod.getConvexUrl()).toThrow("CONVEX_URL is not set");
  });

  it("returns CONVEX_URL when set", async () => {
    process.env.CONVEX_URL = "https://test-deployment.convex.cloud";
    const mod = await import("../convexClient.js");
    expect(mod.getConvexUrl()).toBe("https://test-deployment.convex.cloud");
  });

  it("falls back to NEXT_PUBLIC_CONVEX_URL", async () => {
    delete (process.env as Record<string, unknown>).CONVEX_URL;
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://fallback-deployment.convex.cloud";
    const mod = await import("../convexClient.js");
    expect(mod.getConvexUrl()).toBe("https://fallback-deployment.convex.cloud");
  });
});
```

- [ ] **Step 2: Run test — verify red**

```bash
cd agent && npx vitest run __tests__/convexClient.test.ts
```

Expected: FAIL — `Cannot find module '../convexClient.js'`.

- [ ] **Step 3: Implement agent/convexClient.ts**

```ts
import { ConvexHttpClient } from "convex/browser";

export function getConvexUrl(): string {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error(
      "CONVEX_URL is not set. Add CONVEX_URL=https://your-deployment.convex.cloud to .env.local"
    );
  }
  return url;
}

let _client: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!_client) {
    _client = new ConvexHttpClient(getConvexUrl());
  }
  return _client;
}
```

- [ ] **Step 4: Run test — verify green**

```bash
cd agent && npx vitest run __tests__/convexClient.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/__tests__/convexClient.test.ts agent/convexClient.ts
git commit -m "feat: ConvexHttpClient singleton for agent tools"
```

---

## Task 3: LLM healthcheck + model config (TDD)

**Files:**
- Create: `agent/__tests__/llm.test.ts`
- Modify: `agent/llm.ts`

- [ ] **Step 1: Write the failing test**

Create `agent/__tests__/llm.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("getLLM", () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  it("uses NIM base URL when LLM_PROVIDER=nim", () => {
    process.env.LLM_PROVIDER = "nim";
    process.env.NIM_BASE_URL = "http://localhost:8000/v1";
    const { getLLM } = require("../llm.js");
    const client = getLLM();
    expect((client as { baseURL?: string }).baseURL).toBe("http://localhost:8000/v1");
  });

  it("uses fallback base URL when LLM_PROVIDER=fallback", () => {
    process.env.LLM_PROVIDER = "fallback";
    process.env.FALLBACK_BASE_URL = "https://api.openai.com/v1";
    const { getLLM } = require("../llm.js");
    const client = getLLM();
    expect((client as { baseURL?: string }).baseURL).toBe("https://api.openai.com/v1");
  });
});

describe("getMastraModelConfig", () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  it("returns NIM config when LLM_PROVIDER=nim", async () => {
    process.env.LLM_PROVIDER = "nim";
    process.env.NIM_MODEL = "nvidia/nemotron-70b-instruct";
    process.env.NIM_BASE_URL = "http://localhost:8000/v1";
    const { getMastraModelConfig } = await import("../llm.js");
    const cfg = getMastraModelConfig();
    expect((cfg as { id: string }).id).toBe("nvidia/nemotron-70b-instruct");
    expect((cfg as { url: string }).url).toBe("http://localhost:8000/v1");
  });

  it("returns openai/ prefixed id for fallback without slash", async () => {
    process.env.LLM_PROVIDER = "fallback";
    process.env.FALLBACK_MODEL = "gpt-4o-mini";
    const { getMastraModelConfig } = await import("../llm.js");
    const cfg = getMastraModelConfig();
    expect((cfg as { id: string }).id).toBe("openai/gpt-4o-mini");
  });
});
```

- [ ] **Step 2: Run test — verify red**

```bash
cd agent && npx vitest run __tests__/llm.test.ts
```

Expected: FAIL — `getMastraModelConfig is not exported`.

- [ ] **Step 3: Update agent/llm.ts**

Replace entire file:

```ts
import OpenAI from "openai";

export function getLLM(): OpenAI {
  const useNim = (process.env.LLM_PROVIDER ?? "nim") !== "fallback";
  return new OpenAI({
    baseURL: useNim
      ? (process.env.NIM_BASE_URL ?? "http://localhost:8000/v1")
      : (process.env.FALLBACK_BASE_URL ?? "https://api.openai.com/v1"),
    apiKey:
      (useNim ? process.env.NIM_API_KEY : process.env.FALLBACK_API_KEY) ?? "not-needed",
  });
}

export const MODEL =
  (process.env.LLM_PROVIDER ?? "nim") !== "fallback"
    ? (process.env.NIM_MODEL ?? "nvidia/nemotron-70b-instruct")
    : (process.env.FALLBACK_MODEL ?? "gpt-4o-mini");

type OpenAICompatibleConfig = {
  id: `${string}/${string}`;
  url?: string;
  apiKey?: string;
};

export function getMastraModelConfig(): OpenAICompatibleConfig {
  const useNim = (process.env.LLM_PROVIDER ?? "nim") !== "fallback";
  if (useNim) {
    const model = process.env.NIM_MODEL ?? "nvidia/nemotron-70b-instruct";
    const id = (model.includes("/") ? model : `nim/${model}`) as `${string}/${string}`;
    return {
      id,
      url: process.env.NIM_BASE_URL ?? "http://localhost:8000/v1",
      apiKey: process.env.NIM_API_KEY ?? "not-needed",
    };
  }
  const model = process.env.FALLBACK_MODEL ?? "gpt-4o-mini";
  const id = (model.includes("/") ? model : `openai/${model}`) as `${string}/${string}`;
  return {
    id,
    url: process.env.FALLBACK_BASE_URL ?? undefined,
    apiKey: process.env.FALLBACK_API_KEY ?? "not-needed",
  };
}

/** Ping the LLM provider. Returns false (never throws) on failure. */
export async function healthcheck(): Promise<boolean> {
  try {
    const client = getLLM();
    await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
    });
    return true;
  } catch (err) {
    console.warn("[llm] healthcheck failed:", (err as Error).message);
    return false;
  }
}
```

- [ ] **Step 4: Run test — verify green**

```bash
cd agent && npx vitest run __tests__/llm.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Fix ping.ts to use correct execute signature**

Replace `agent/tools/ping.ts`:

```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const pingTool = createTool({
  id: "ping",
  description: "Health-check tool. Returns pong. Used to verify agent tool wiring.",
  inputSchema: z.object({ message: z.string().optional() }),
  outputSchema: z.object({ pong: z.string(), ts: z.string() }),
  execute: async (inputData) => ({
    pong: inputData.message ?? "pong",
    ts: new Date().toISOString(),
  }),
});
```

- [ ] **Step 6: Commit**

```bash
git add agent/__tests__/llm.test.ts agent/llm.ts agent/tools/ping.ts
git commit -m "feat: LLM getMastraModelConfig + healthcheck; fix ping execute signature"
```

---

## Task 4: getForecast tool (TDD)

**Files:**
- Create: `agent/tools/__tests__/getForecast.test.ts`
- Create: `agent/tools/getForecast.ts`

- [ ] **Step 1: Write the failing test**

Create `agent/tools/__tests__/getForecast.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../convexClient.js", () => ({
  getConvexClient: vi.fn(),
}));

import { getConvexClient } from "../../convexClient.js";
import { getForecastTool } from "../getForecast.js";

describe("getForecastTool", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClient).mockReturnValue({ query: mockQuery } as never);
  });

  const fixture = [
    {
      wardId: "ward-03",
      category: "pothole",
      horizonStart: "2026-05-31",
      horizonEnd: "2026-06-07",
      predictedCount: 42,
      confidenceLow: 33,
      confidenceHigh: 52,
      method: "movingavg",
    },
  ];

  it("returns forecast rows for a category", async () => {
    mockQuery.mockResolvedValue(fixture);
    const result = await getForecastTool.execute!({ category: "pothole" } as never, {} as never);
    expect(result).toEqual(fixture);
    expect(mockQuery).toHaveBeenCalledOnce();
  });

  it("passes wardId and category to Convex", async () => {
    mockQuery.mockResolvedValue(fixture);
    await getForecastTool.execute!({ wardId: "ward-03", category: "pothole" } as never, {} as never);
    const [, args] = mockQuery.mock.calls[0];
    expect(args).toMatchObject({ wardId: "ward-03", category: "pothole" });
  });

  it("returns empty array when Convex returns null", async () => {
    mockQuery.mockResolvedValue(null);
    const result = await getForecastTool.execute!({} as never, {} as never);
    expect(result).toEqual([]);
  });

  it("returns empty array on Convex error", async () => {
    mockQuery.mockRejectedValue(new Error("network error"));
    const result = await getForecastTool.execute!({} as never, {} as never);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — verify red**

```bash
cd agent && npx vitest run tools/__tests__/getForecast.test.ts
```

Expected: FAIL — `Cannot find module '../getForecast.js'`.

- [ ] **Step 3: Implement agent/tools/getForecast.ts**

```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConvexClient } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

export const getForecastTool = createTool({
  id: "getForecast",
  description:
    "Predicted 311 request counts per ward for the next 7 days. Use when asked which wards will see the most complaints next week, or for crew planning and staffing questions.",
  inputSchema: z.object({
    wardId: z.string().optional(),
    category: z.string().optional(),
  }),
  execute: async (inputData) => {
    try {
      const result = await getConvexClient().query(api.queries.getForecast, {
        wardId: inputData.wardId,
        category: inputData.category,
      });
      return result ?? [];
    } catch (err) {
      console.error("[getForecast] Convex query failed:", (err as Error).message);
      return [];
    }
  },
});
```

- [ ] **Step 4: Run test — verify green**

```bash
cd agent && npx vitest run tools/__tests__/getForecast.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/tools/__tests__/getForecast.test.ts agent/tools/getForecast.ts
git commit -m "feat: getForecast Mastra tool with Convex wiring (TDD)"
```

---

## Task 5: getHotspots tool (TDD)

**Files:**
- Create: `agent/tools/__tests__/getHotspots.test.ts`
- Create: `agent/tools/getHotspots.ts`

- [ ] **Step 1: Write the failing test**

Create `agent/tools/__tests__/getHotspots.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../convexClient.js", () => ({
  getConvexClient: vi.fn(),
}));

import { getConvexClient } from "../../convexClient.js";
import { getHotspotsTool } from "../getHotspots.js";

describe("getHotspotsTool", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClient).mockReturnValue({ query: mockQuery } as never);
  });

  const fixture = [
    {
      category: "pothole",
      wardId: "ward-03",
      neighbourhood: "Etobicoke-Lakeshore",
      centroidLat: 43.63,
      centroidLng: -79.5,
      intensity: 0.9,
      count: 840,
    },
  ];

  it("returns hotspot rows", async () => {
    mockQuery.mockResolvedValue(fixture);
    const result = await getHotspotsTool.execute!({} as never, {} as never);
    expect(result).toEqual(fixture);
  });

  it("passes category filter to Convex", async () => {
    mockQuery.mockResolvedValue(fixture);
    await getHotspotsTool.execute!({ category: "pothole" } as never, {} as never);
    const [, args] = mockQuery.mock.calls[0];
    expect(args).toMatchObject({ category: "pothole" });
  });

  it("returns empty array when Convex returns null", async () => {
    mockQuery.mockResolvedValue(null);
    const result = await getHotspotsTool.execute!({} as never, {} as never);
    expect(result).toEqual([]);
  });

  it("returns empty array on error", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    const result = await getHotspotsTool.execute!({} as never, {} as never);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — verify red**

```bash
cd agent && npx vitest run tools/__tests__/getHotspots.test.ts
```

Expected: FAIL — `Cannot find module '../getHotspots.js'`.

- [ ] **Step 3: Implement agent/tools/getHotspots.ts**

```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConvexClient } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

export const getHotspotsTool = createTool({
  id: "getHotspots",
  description:
    "Geographic clusters of 311 activity with centroid lat/lng and intensity. Use when asked where complaints are concentrated, to populate a map heat layer, or to identify problem areas by neighbourhood.",
  inputSchema: z.object({
    category: z.string().optional(),
  }),
  execute: async (inputData) => {
    try {
      const result = await getConvexClient().query(api.queries.getHotspots, {
        category: inputData.category,
      });
      return result ?? [];
    } catch (err) {
      console.error("[getHotspots] Convex query failed:", (err as Error).message);
      return [];
    }
  },
});
```

- [ ] **Step 4: Run test — verify green**

```bash
cd agent && npx vitest run tools/__tests__/getHotspots.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/tools/__tests__/getHotspots.test.ts agent/tools/getHotspots.ts
git commit -m "feat: getHotspots Mastra tool (TDD)"
```

---

## Task 6: getRiskScore tool (TDD)

**Files:**
- Create: `agent/tools/__tests__/getRiskScore.test.ts`
- Create: `agent/tools/getRiskScore.ts`

- [ ] **Step 1: Write the failing test**

Create `agent/tools/__tests__/getRiskScore.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../convexClient.js", () => ({
  getConvexClient: vi.fn(),
}));

import { getConvexClient } from "../../convexClient.js";
import { getRiskScoreTool } from "../getRiskScore.js";

describe("getRiskScoreTool", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClient).mockReturnValue({ query: mockQuery } as never);
  });

  const fixture = [
    {
      wardId: "ward-03",
      category: "flooding",
      score: 78,
      drivers: ["heavy rain forecast", "rising 14-day trend"],
      asOf: "2026-05-30",
    },
  ];

  it("returns risk score rows", async () => {
    mockQuery.mockResolvedValue(fixture);
    const result = await getRiskScoreTool.execute!({} as never, {} as never);
    expect(result).toEqual(fixture);
  });

  it("every row has non-empty drivers array", async () => {
    mockQuery.mockResolvedValue(fixture);
    const result = (await getRiskScoreTool.execute!({} as never, {} as never)) as typeof fixture;
    expect(result.every((r) => r.drivers.length > 0)).toBe(true);
  });

  it("passes wardId filter to Convex", async () => {
    mockQuery.mockResolvedValue(fixture);
    await getRiskScoreTool.execute!({ wardId: "ward-03" } as never, {} as never);
    const [, args] = mockQuery.mock.calls[0];
    expect(args).toMatchObject({ wardId: "ward-03" });
  });

  it("returns empty array on error", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    const result = await getRiskScoreTool.execute!({} as never, {} as never);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — verify red**

```bash
cd agent && npx vitest run tools/__tests__/getRiskScore.test.ts
```

Expected: FAIL — `Cannot find module '../getRiskScore.js'`.

- [ ] **Step 3: Implement agent/tools/getRiskScore.ts**

```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConvexClient } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

export const getRiskScoreTool = createTool({
  id: "getRiskScore",
  description:
    "Composite 0–100 risk score per ward with human-readable driver labels. Use when asked which wards are at highest risk, why a ward is flagged, or to prioritise resource allocation.",
  inputSchema: z.object({
    wardId: z.string().optional(),
  }),
  execute: async (inputData) => {
    try {
      const result = await getConvexClient().query(api.queries.getRiskScores, {
        wardId: inputData.wardId,
      });
      return result ?? [];
    } catch (err) {
      console.error("[getRiskScore] Convex query failed:", (err as Error).message);
      return [];
    }
  },
});
```

- [ ] **Step 4: Run test — verify green**

```bash
cd agent && npx vitest run tools/__tests__/getRiskScore.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/tools/__tests__/getRiskScore.test.ts agent/tools/getRiskScore.ts
git commit -m "feat: getRiskScore Mastra tool (TDD)"
```

---

## Task 7: queryRequests tool (TDD)

**Files:**
- Create: `agent/tools/__tests__/queryRequests.test.ts`
- Create: `agent/tools/queryRequests.ts`

- [ ] **Step 1: Write the failing test**

Create `agent/tools/__tests__/queryRequests.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../convexClient.js", () => ({
  getConvexClient: vi.fn(),
}));

import { getConvexClient } from "../../convexClient.js";
import { queryRequestsTool } from "../queryRequests.js";

describe("queryRequestsTool", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClient).mockReturnValue({ query: mockQuery } as never);
  });

  const fixture = [
    {
      date: "2025-03-01",
      wardId: "ward-03",
      category: "pothole",
      count: 12,
      tempC: 5.2,
      precipMm: 18.0,
    },
  ];

  it("returns daily aggregate rows", async () => {
    mockQuery.mockResolvedValue(fixture);
    const result = await queryRequestsTool.execute!({} as never, {} as never);
    expect(result).toEqual(fixture);
  });

  it("passes all optional filters to Convex", async () => {
    mockQuery.mockResolvedValue(fixture);
    await queryRequestsTool.execute!(
      { wardId: "ward-03", category: "pothole", from: "2025-01-01", to: "2025-12-31" } as never,
      {} as never
    );
    const [, args] = mockQuery.mock.calls[0];
    expect(args).toMatchObject({
      wardId: "ward-03",
      category: "pothole",
      from: "2025-01-01",
      to: "2025-12-31",
    });
  });

  it("returns empty array on error", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    const result = await queryRequestsTool.execute!({} as never, {} as never);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — verify red**

```bash
cd agent && npx vitest run tools/__tests__/queryRequests.test.ts
```

Expected: FAIL — `Cannot find module '../queryRequests.js'`.

- [ ] **Step 3: Implement agent/tools/queryRequests.ts**

```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConvexClient } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

export const queryRequestsTool = createTool({
  id: "queryRequests",
  description:
    "Historical daily aggregate 311 request counts by ward, category, and date range with weather data. Use for trend analysis, year-over-year comparisons, weather correlation questions, or when asked how complaints changed over time.",
  inputSchema: z.object({
    wardId: z.string().optional(),
    category: z.string().optional(),
    from: z.string().optional().describe("ISO date YYYY-MM-DD"),
    to: z.string().optional().describe("ISO date YYYY-MM-DD"),
  }),
  execute: async (inputData) => {
    try {
      const result = await getConvexClient().query(api.queries.getDailyAggregates, {
        wardId: inputData.wardId,
        category: inputData.category,
        from: inputData.from,
        to: inputData.to,
      });
      return result ?? [];
    } catch (err) {
      console.error("[queryRequests] Convex query failed:", (err as Error).message);
      return [];
    }
  },
});
```

- [ ] **Step 4: Run test — verify green**

```bash
cd agent && npx vitest run tools/__tests__/queryRequests.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/tools/__tests__/queryRequests.test.ts agent/tools/queryRequests.ts
git commit -m "feat: queryRequests Mastra tool (TDD)"
```

---

## Task 8: simulateWeather tool (TDD)

**Files:**
- Create: `agent/tools/__tests__/simulateWeather.test.ts`
- Create: `agent/tools/simulateWeather.ts`

- [ ] **Step 1: Write the failing test**

Create `agent/tools/__tests__/simulateWeather.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../convexClient.js", () => ({
  getConvexClient: vi.fn(),
}));

import { getConvexClient } from "../../convexClient.js";
import { simulateWeatherTool } from "../simulateWeather.js";

describe("simulateWeatherTool", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClient).mockReturnValue({ query: mockQuery } as never);
  });

  const baseForecast = [
    {
      wardId: "ward-03",
      category: "flooding",
      horizonStart: "2026-05-31",
      horizonEnd: "2026-06-07",
      predictedCount: 20,
      confidenceLow: 16,
      confidenceHigh: 25,
      method: "movingavg",
    },
  ];

  it("returns an array of Forecast objects", async () => {
    mockQuery.mockResolvedValue(baseForecast);
    const result = (await simulateWeatherTool.execute!(
      { scenario: "heavy_rain" } as never,
      {} as never
    )) as { wardId: string }[];
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("wardId");
    expect(result[0]).toHaveProperty("predictedCount");
  });

  it("heavy_rain scenario increases predictedCount vs baseline", async () => {
    mockQuery.mockResolvedValue(baseForecast);
    const result = (await simulateWeatherTool.execute!(
      { scenario: "heavy_rain", category: "flooding" } as never,
      {} as never
    )) as { predictedCount: number }[];
    expect(result[0].predictedCount).toBeGreaterThan(20);
  });

  it("dry_spell scenario decreases predictedCount vs baseline", async () => {
    mockQuery.mockResolvedValue(baseForecast);
    const result = (await simulateWeatherTool.execute!(
      { scenario: "dry_spell", category: "flooding" } as never,
      {} as never
    )) as { predictedCount: number }[];
    expect(result[0].predictedCount).toBeLessThan(20);
  });

  it("returns empty array when no baseline data", async () => {
    mockQuery.mockResolvedValue([]);
    const result = await simulateWeatherTool.execute!(
      { scenario: "heavy_rain" } as never,
      {} as never
    );
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — verify red**

```bash
cd agent && npx vitest run tools/__tests__/simulateWeather.test.ts
```

Expected: FAIL — `Cannot find module '../simulateWeather.js'`.

- [ ] **Step 3: Implement agent/tools/simulateWeather.ts**

```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConvexClient } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

const MULTIPLIERS: Record<string, number> = {
  heavy_rain: 1.4,
  light_rain: 1.15,
  dry_spell: 0.7,
  heat_wave: 1.2,
  normal: 1.0,
};

export const simulateWeatherTool = createTool({
  id: "simulateWeather",
  description:
    "Simulate how a weather scenario (heavy_rain, dry_spell, heat_wave, light_rain, normal) would affect 311 request counts. Use for 'what if' planning questions like 'what happens if it rains heavily next week?'",
  inputSchema: z.object({
    scenario: z
      .enum(["heavy_rain", "light_rain", "dry_spell", "heat_wave", "normal"])
      .describe("Weather scenario to simulate"),
    category: z.string().optional().describe("Limit to a specific category (e.g. flooding, pothole)"),
  }),
  execute: async (inputData) => {
    try {
      const baseline = await getConvexClient().query(api.queries.getForecast, {
        category: inputData.category,
      });
      if (!baseline || baseline.length === 0) return [];
      const multiplier = MULTIPLIERS[inputData.scenario] ?? 1.0;
      return baseline.map((f: {
        wardId: string;
        category: string;
        horizonStart: string;
        horizonEnd: string;
        predictedCount: number;
        confidenceLow: number;
        confidenceHigh: number;
        method: string;
      }) => ({
        ...f,
        predictedCount: Math.round(f.predictedCount * multiplier),
        confidenceLow: Math.round(f.confidenceLow * multiplier),
        confidenceHigh: Math.round(f.confidenceHigh * multiplier),
        method: `simulated-${inputData.scenario}`,
      }));
    } catch (err) {
      console.error("[simulateWeather] failed:", (err as Error).message);
      return [];
    }
  },
});
```

- [ ] **Step 4: Run test — verify green**

```bash
cd agent && npx vitest run tools/__tests__/simulateWeather.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/tools/__tests__/simulateWeather.test.ts agent/tools/simulateWeather.ts
git commit -m "feat: simulateWeather stub tool (TDD)"
```

---

## Task 9: Update agent/index.ts — all tools + system prompt

**Files:**
- Modify: `agent/index.ts`

- [ ] **Step 1: Replace agent/index.ts**

```ts
import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { getMastraModelConfig } from "./llm.js";
import { pingTool } from "./tools/ping.js";
import { getForecastTool } from "./tools/getForecast.js";
import { getHotspotsTool } from "./tools/getHotspots.js";
import { getRiskScoreTool } from "./tools/getRiskScore.js";
import { queryRequestsTool } from "./tools/queryRequests.js";
import { simulateWeatherTool } from "./tools/simulateWeather.js";

const systemPrompt = `You are 311 Pulse, an intelligent assistant for the City of Toronto's 311 operations team.

You help city planners, ward councillors, and operations staff understand and predict 311 service request patterns across Toronto's 25 wards. Data covers 2023–2025 across 7 categories: pothole, garbage, flooding, graffiti, tree, noise, other.

## When to use each tool

- **getForecast**: Use when asked which wards will see the most complaints NEXT WEEK, for staffing/crew planning questions, or any future-oriented volume question.
- **getHotspots**: Use when asked WHERE complaints are concentrated geographically, to populate a map, or to identify high-density problem areas.
- **getRiskScore**: Use when asked which wards are at HIGHEST RISK, why a ward is flagged, or to prioritise resource allocation by risk level.
- **queryRequests**: Use for HISTORICAL analysis — trend over time, year-over-year comparisons, weather correlation, or "how did X change in Y period".
- **simulateWeather**: Use for "what if" planning — e.g. "what happens if it rains heavily next week?" Returns a scaled forecast.
- **ping**: Health check only — do not use for real queries.

## Answer style

- Always cite specific ward IDs (e.g., "ward-03", "ward-12") and numeric values from the data.
- Recommend specific, actionable steps (e.g., "pre-position crews in ward-03 and ward-07 before Friday").
- Cite the `drivers` field from risk scores when explaining WHY a ward is flagged.
- If data is empty or unavailable, say so honestly — do not invent numbers.
- Be concise. Bullet points preferred for lists of wards.`;

export const agent = new Agent({
  name: "311-pulse-agent",
  instructions: systemPrompt,
  model: getMastraModelConfig(),
  tools: {
    pingTool,
    getForecastTool,
    getHotspotsTool,
    getRiskScoreTool,
    queryRequestsTool,
    simulateWeatherTool,
  },
});

export const mastra = new Mastra({
  agents: { "311-pulse-agent": agent },
});
```

- [ ] **Step 2: Typecheck**

```bash
cd agent && npx tsc --noEmit
```

Expected: No errors. If there are import errors for `../../convex/_generated/api.js`, ensure `convex dev` has been run and the generated files exist at `convex/_generated/`.

- [ ] **Step 3: Run full agent test suite**

```bash
cd agent && npx vitest run
```

Expected: All tests PASS (convexClient, llm, getForecast, getHotspots, getRiskScore, queryRequests, simulateWeather).

- [ ] **Step 4: Commit**

```bash
git add agent/index.ts
git commit -m "feat: register all 5 Mastra tools + real system prompt in agent/index.ts"
```

---

## Task 10: Wire CopilotKit route

**Files:**
- Modify: `app/app/api/copilotkit/route.ts`

- [ ] **Step 1: Replace app/app/api/copilotkit/route.ts**

```ts
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { getLocalAgents } from "@ag-ui/mastra";
import { mastra } from "@311pulse/agent";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const runtime = new CopilotRuntime({
    agents: getLocalAgents({ mastra, resourceId: "311-pulse-agent" }),
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
```

- [ ] **Step 2: Typecheck the app**

```bash
cd app && npx tsc --noEmit
```

Expected: No errors. If `@311pulse/agent` types are missing, run `npm install` from root first.

- [ ] **Step 3: Start the dev server**

```bash
npm run dev
```

Open browser to the app URL. Open the chat panel. Type:

> "ping"

Expected: A response (any response) — confirms the route is alive.

- [ ] **Step 4: Test with a real question**

In chat type:

> "Which wards will see the most pothole complaints next week?"

Expected: Response mentions specific ward IDs (e.g., "ward-03", "ward-12") and numeric predictions. If the LLM is not reachable (NIM offline), check `FALLBACK_BASE_URL` and `FALLBACK_API_KEY` in `app/.env.local`.

- [ ] **Step 5: Commit**

```bash
git add app/app/api/copilotkit/route.ts
git commit -m "feat: wire CopilotKit route to Mastra via @ag-ui/mastra getLocalAgents"
```

---

## Task 11: Smoke test scripts

**Files:**
- Create: `agent/scripts/smoke-llm.mjs`
- Create: `agent/scripts/smoke-agent.mjs`

- [ ] **Step 1: Create agent/scripts/smoke-llm.mjs**

```js
#!/usr/bin/env node
// One-shot LLM completion round-trip.
// Usage: node agent/scripts/smoke-llm.mjs
//        LLM_PROVIDER=fallback node agent/scripts/smoke-llm.mjs

import { getLLM, MODEL } from "../llm.js";

const provider = (process.env.LLM_PROVIDER ?? "nim");
console.log(`[smoke-llm] provider=${provider} model=${MODEL}`);

try {
  const client = getLLM();
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: "Reply with exactly: PONG" }],
    max_tokens: 10,
  });
  const text = res.choices[0]?.message?.content ?? "(empty)";
  console.log(`[smoke-llm] response: ${text}`);
  console.log("[smoke-llm] ✓ PASS");
  process.exit(0);
} catch (err) {
  console.error("[smoke-llm] ✗ FAIL:", err.message);
  process.exit(1);
}
```

- [ ] **Step 2: Create agent/scripts/smoke-agent.mjs**

```js
#!/usr/bin/env node
// Full agent smoke test — verifies getForecast tool is triggered.
// Usage: node agent/scripts/smoke-agent.mjs "Which wards see most potholes next week?"
// Requires CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL) and LLM env vars in environment.

import { config } from "dotenv";
import { resolve } from "path";

// Load app/.env.local from repo root
config({ path: resolve(process.cwd(), "app/.env.local") });

import { agent } from "../index.js";

const question = process.argv[2] ?? "Which wards will see the most pothole complaints next week?";
console.log(`[smoke-agent] question: ${question}`);

try {
  const result = await agent.generate([{ role: "user", content: question }]);
  const text = result.text ?? result.response ?? JSON.stringify(result);
  console.log(`[smoke-agent] response:\n${text}`);

  const hasWardRef = /ward-\d+/i.test(text);
  if (!hasWardRef) {
    console.warn("[smoke-agent] WARNING: response does not mention ward IDs — tool may not have fired");
  } else {
    console.log("[smoke-agent] ✓ ward IDs found in response — getForecast tool fired");
  }
  process.exit(0);
} catch (err) {
  console.error("[smoke-agent] ✗ FAIL:", err.message);
  process.exit(1);
}
```

- [ ] **Step 3: Add dotenv to agent dependencies (needed by smoke-agent)**

Add to `agent/package.json` dependencies:

```json
"dotenv": "^16"
```

Run from repo root:
```bash
npm install
```

- [ ] **Step 4: Run smoke-llm (requires LLM provider configured)**

```bash
node agent/scripts/smoke-llm.mjs
```

Expected output:
```
[smoke-llm] provider=nim model=nvidia/nemotron-...
[smoke-llm] response: PONG
[smoke-llm] ✓ PASS
```

If NIM is offline, test fallback:
```bash
LLM_PROVIDER=fallback node agent/scripts/smoke-llm.mjs
```

- [ ] **Step 5: Run smoke-agent (requires CONVEX_URL + LLM configured)**

```bash
node agent/scripts/smoke-agent.mjs "Which wards see most potholes next week?"
```

Expected: Response contains `ward-XX` references; confirmation line printed.

- [ ] **Step 6: Commit**

```bash
git add agent/scripts/smoke-llm.mjs agent/scripts/smoke-agent.mjs agent/package.json
git commit -m "feat: smoke-llm + smoke-agent scripts for Phase 2 acceptance test"
```

---

## Task 12: Full test run + progress update

- [ ] **Step 1: Run full agent test suite**

```bash
cd agent && npx vitest run
```

Expected: All tests PASS (0 failures).

- [ ] **Step 2: Run app typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Update docs/02-backend-and-agent.md progress tracker**

Mark these items complete:
- `agent/llm.ts` — `healthcheck()` + `getMastraModelConfig()`
- `agent/convexClient.ts` — ConvexHttpClient singleton
- All 5 Mastra tools (getForecast, getHotspots, getRiskScore, queryRequests, simulateWeather)
- CopilotKit route wired via `@ag-ui/mastra`
- All tool tests (TDD red → green)
- Smoke scripts

Update status to 🟢 Complete, completion to 90% (smoke tests require live infra).

- [ ] **Step 4: Update docs/README.md**

Update Phase 2 row: `🟢 Complete (pending live LLM smoke)` | `████████████░░` 87% | `Smoke test with live NIM; Phase 3 map + generative UI`

- [ ] **Step 5: Final commit**

```bash
git add docs/02-backend-and-agent.md docs/README.md
git commit -m "docs: Phase 2 complete — Mastra tools + CopilotKit wired"
```
