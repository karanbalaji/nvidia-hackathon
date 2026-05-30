import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// Phase 2 replaces this with the Mastra AG-UI adapter via @ag-ui/mastra.
// For Phase 0 this is a no-op echo handler so <CopilotChat /> renders.
const runtime = new CopilotRuntime({});

const serviceAdapter = new OpenAIAdapter({
  model: process.env.FALLBACK_MODEL ?? "gpt-4o-mini",
  openai: {
    apiKey: process.env.FALLBACK_API_KEY ?? "placeholder-not-needed-in-phase-0",
    baseURL: process.env.FALLBACK_BASE_URL,
  } as never,
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
