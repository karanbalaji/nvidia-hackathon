import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConvexClient } from "../convexClient";
import { api } from "../../convex/_generated/api";

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
  execute: async (params) => {
    try {
      const input = ((params as { context?: unknown })?.context ?? params ?? {}) as {
        wardId?: string;
        category?: string;
        from?: string;
        to?: string;
      };
      const args: { wardId?: string; category?: string; from?: string; to?: string } = {};
      if (input.wardId) args.wardId = input.wardId;
      if (input.category) args.category = input.category;
      if (input.from) args.from = input.from;
      if (input.to) args.to = input.to;
      const result = await getConvexClient().query(api.queries.getDailyAggregates, args);
      // Cap at 200 records — returning thousands of rows causes oversized TOOL_CALL_RESULT
      // payloads that break the CopilotKit SSE stream and leave the thread stuck.
      return (result ?? []).slice(0, 200);
    } catch (err) {
      console.error("[queryRequests] Convex query failed:", (err as Error).message);
      return [];
    }
  },
});
