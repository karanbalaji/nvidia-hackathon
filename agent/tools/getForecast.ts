import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConvexClient } from "../convexClient";
import { api } from "../../convex/_generated/api";

export const getForecastTool = createTool({
  id: "getForecast",
  description:
    "Predicted 311 request counts per ward for the next 7 days. Use when asked which wards will see the most complaints next week, or for crew planning and staffing questions. Valid category values: pothole, flooding, garbage, graffiti, noise, tree, other. Always use singular form (e.g. 'pothole' not 'potholes').",
  inputSchema: z.object({
    wardId: z.string().optional(),
    category: z.string().optional().describe("One of: pothole, flooding, garbage, graffiti, noise, tree, other"),
  }),
  execute: async (params) => {
    try {
      const input = ((params as { context?: unknown })?.context ?? params ?? {}) as {
        wardId?: string;
        category?: string;
      };
      const args: { wardId?: string; category?: string } = {};
      if (input.wardId && input.wardId !== "null") args.wardId = input.wardId;
      if (input.category && input.category !== "null") args.category = input.category;
      const result = await getConvexClient().query(api.queries.getForecast, args);
      return result ?? [];
    } catch (err) {
      console.error("[getForecast] Convex query failed:", (err as Error).message);
      return [];
    }
  },
});
