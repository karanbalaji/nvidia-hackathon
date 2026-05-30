import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { HotspotSchema } from "@311pulse/contracts";
import { convex } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

export const getHotspotsTool = createTool({
  id: "getHotspots",
  description:
    "Geographic hotspot clusters for 311 categories. Use when asked about spatial patterns, high-density areas, or where to pre-position crews.",
  inputSchema: z.object({
    category: z.string().optional().describe("Category filter"),
  }),
  outputSchema: z.array(HotspotSchema),
  execute: async (input) => {
    try {
      const rows = await convex.query(api.queries.getHotspots, {
        category: input.category,
      });
      return rows.map((row: Record<string, unknown>) => HotspotSchema.parse(row));
    } catch {
      return [];
    }
  },
});
