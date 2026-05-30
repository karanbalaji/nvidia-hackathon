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
