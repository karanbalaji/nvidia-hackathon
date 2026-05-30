import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConvexClient } from "../convexClient";
import { api } from "../../convex/_generated/api";

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
