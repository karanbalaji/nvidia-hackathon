/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { getLocalAgents } from "@ag-ui/mastra";
import { mastra } from "@311pulse/agent";
import { NextRequest } from "next/server";

/**
 * @mastra/core 1.36+ streams tool calls incrementally:
 *   tool-call-input-streaming-start → tool-call-delta(s) → tool-call-input-streaming-end
 *
 * @ag-ui/mastra 1.0.3 expects a single `tool-call` chunk with full args.
 * This transformer reassembles streaming chunks into the expected format.
 */
async function* normalizeToolCallStream(stream: AsyncIterable<any>): AsyncIterable<any> {
  const assembled = new Set<string>();
  const pending = new Map<string, { toolName: string; argsText: string }>();

  for await (const chunk of stream) {
    const { type, payload } = chunk ?? {};

    if (type === "tool-call-input-streaming-start") {
      pending.set(payload.toolCallId, { toolName: payload.toolName, argsText: "" });
      continue;
    }
    if (type === "tool-call-delta") {
      const entry = pending.get(payload.toolCallId);
      if (entry) entry.argsText += payload.argsTextDelta ?? "";
      continue;
    }
    if (type === "tool-call-input-streaming-end") {
      const entry = pending.get(payload.toolCallId);
      if (entry) {
        let args: unknown = {};
        try { args = JSON.parse(entry.argsText || "{}"); } catch { /* keep {} */ }
        assembled.add(payload.toolCallId);
        pending.delete(payload.toolCallId);
        yield { ...chunk, type: "tool-call", payload: { toolCallId: payload.toolCallId, toolName: entry.toolName, args } };
      }
      continue;
    }
    // Skip the duplicate complete tool-call that AI SDK emits after streaming sequence
    if (type === "tool-call" && assembled.has(payload?.toolCallId)) {
      assembled.delete(payload.toolCallId);
      continue;
    }
    // text-start / text-end are bookkeeping — text-delta carries content
    if (type === "text-start" || type === "text-end") continue;

    yield chunk;
  }
}

/**
 * Patch each Mastra agent once (singleton) so that:
 * 1. clientTools whose names match registered backend tools are stripped — otherwise
 *    Mastra spreads clientTools LAST and they override the execute() functions, causing
 *    the agent to suspend and return empty results.
 * 2. fullStream is wrapped to normalize streaming tool-call chunks.
 */
// Tool names registered server-side in agent/index.ts — these must NOT be
// passed as clientTools or Mastra will override the execute() functions with
// a client-side suspend mechanism, returning empty results.
const BACKEND_TOOL_NAMES = new Set([
  "ping", "getForecast", "getHotspots", "getRiskScore", "queryRequests", "simulateWeather",
]);

let patched = false;
function patchMastraOnce(m: any): void {
  if (patched) return;
  patched = true;

  const agents = m.listAgents?.() ?? {};
  for (const agent of Object.values(agents) as any[]) {
    const orig = agent.stream.bind(agent);
    agent.stream = async (messages: any, options: any, ...rest: any[]) => {
      // Strip clientTools that collide with registered backend tools.
      // Mastra merges: { ...assignedTools, ...clientSideTools } — clientSideTools
      // (built from options.clientTools) comes AFTER and overrides assignedTools,
      // replacing the execute() function with a client-suspend mechanism → empty results.
      const filteredOptions = options?.clientTools
        ? {
            ...options,
            clientTools: Object.fromEntries(
              Object.entries(options.clientTools as Record<string, unknown>).filter(
                ([name]) => !BACKEND_TOOL_NAMES.has(name)
              )
            ),
          }
        : options;

      const result = await orig(messages, filteredOptions, ...rest);
      if (!result?.fullStream) return result;

      const normalized = normalizeToolCallStream(result.fullStream);
      return new Proxy(result, {
        get(target, prop) {
          if (prop === "fullStream") return normalized;
          const val = target[prop];
          return typeof val === "function" ? val.bind(target) : val;
        },
      });
    };
  }
}

// Patch once at module load time
patchMastraOnce(mastra);

function createHandler() {
  const runtime = new CopilotRuntime({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agents: getLocalAgents({ mastra: mastra as any, resourceId: "311-pulse-agent" }) as any,
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest;
}

export const GET = async (req: NextRequest) => createHandler()(req);
export const POST = async (req: NextRequest) => createHandler()(req);
