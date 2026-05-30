/**
 * CopilotKit runtime endpoint.
 *
 * Wires four server-side actions (§3.5 tool contract) into the CopilotKit runtime
 * so the LLM (NIM via NIM_BASE_URL, or fallback) can call them and stream results
 * to the frontend for generative UI rendering.
 *
 * Tool contract (§3.5):
 *   getForecast    → Forecast[]       → ranked bar chart + map highlight
 *   queryRequests  → DailyAggregate[] → trend line chart
 *   getHotspots    → Hotspot[]        → map heat layer
 *   getRiskScore   → RiskScore[]      → risk panel / choropleth
 */
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { ConvexHttpClient } from "convex/browser";
import OpenAI from "openai";
import { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = Record<string, any>;

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
);

// Convenience wrapper — Convex's typed query function refs are not available here
// (they're in the agent package), so we use string-based references.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (name: string, args: AnyArgs) => (convex.query as any)(name, args);

function buildAdapter() {
  const nim = (process.env.LLM_PROVIDER ?? "nim") !== "fallback";
  const client = new OpenAI({
    apiKey:
      (nim ? process.env.NIM_API_KEY : process.env.FALLBACK_API_KEY) ??
      "not-needed",
    baseURL: nim
      ? (process.env.NIM_BASE_URL ?? "http://localhost:8000/v1")
      : (process.env.FALLBACK_BASE_URL ?? "https://api.openai.com/v1"),
  });
  return new OpenAIAdapter({
    model: nim
      ? (process.env.NIM_MODEL ?? "nvidia/nemotron-70b-instruct")
      : (process.env.FALLBACK_MODEL ?? "gpt-4o-mini"),
    openai: client,
  });
}

// Server-side action definitions keyed to §3.5 tool contract.
// The CopilotKit LLM calls these; results stream to the frontend so
// useCopilotAction hooks can render generative UI (ForecastBarChart, etc.)
const runtime = new CopilotRuntime({
  actions: [
    {
      name: "getForecast",
      description:
        "Predicted 311 request counts per ward for the next 7 days. Use for 'which wards will see most X next week?' questions.",
      parameters: [
        {
          name: "wardId",
          type: "string" as const,
          description: "Ward ID (e.g. ward-01). Omit for all wards.",
          required: false,
        },
        {
          name: "category",
          type: "string" as const,
          description:
            "Category: pothole | garbage | flooding | noise. Omit for all.",
          required: false,
        },
      ],
      handler: async (args: AnyArgs) => {
        try {
          return await q("queries:getForecast", {
            wardId: args.wardId,
            category: args.category,
          });
        } catch {
          return [];
        }
      },
    },
    {
      name: "queryRequests",
      description:
        "Historical daily 311 request counts per ward × category. Use for trend analysis, period comparisons, or weather correlations.",
      parameters: [
        {
          name: "wardId",
          type: "string" as const,
          description: "Ward ID filter",
          required: false,
        },
        {
          name: "category",
          type: "string" as const,
          description: "Category filter",
          required: false,
        },
        {
          name: "from",
          type: "string" as const,
          description: "Start date YYYY-MM-DD",
          required: false,
        },
        {
          name: "to",
          type: "string" as const,
          description: "End date YYYY-MM-DD",
          required: false,
        },
      ],
      handler: async (args: AnyArgs) => {
        try {
          return await q("queries:getDailyAggregates", {
            wardId: args.wardId,
            category: args.category,
            from: args.from,
            to: args.to,
          });
        } catch {
          return [];
        }
      },
    },
    {
      name: "getHotspots",
      description:
        "Geographic hotspot clusters for 311 categories. Use for spatial pattern or high-density area questions.",
      parameters: [
        {
          name: "category",
          type: "string" as const,
          description: "Category filter",
          required: false,
        },
      ],
      handler: async (args: AnyArgs) => {
        try {
          return await q("queries:getHotspots", { category: args.category });
        } catch {
          return [];
        }
      },
    },
    {
      name: "getRiskScore",
      description:
        "Composite risk scores (0–100) per ward with driver explanations. Use for high-risk area or alert priority questions.",
      parameters: [
        {
          name: "wardId",
          type: "string" as const,
          description: "Ward ID filter",
          required: false,
        },
      ],
      handler: async (args: AnyArgs) => {
        try {
          return await q("queries:getRiskScores", { wardId: args.wardId });
        } catch {
          return [];
        }
      },
    },
  ],
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: buildAdapter(),
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
