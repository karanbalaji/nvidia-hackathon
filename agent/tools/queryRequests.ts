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
