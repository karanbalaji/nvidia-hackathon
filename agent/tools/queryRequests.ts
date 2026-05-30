import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { DailyAggregateSchema } from "@311pulse/contracts";
import { convex } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

export const queryRequestsTool = createTool({
  id: "queryRequests",
  description:
    "Historical daily 311 request counts per ward × category. Use for trend analysis, rain correlations, or period comparisons.",
  inputSchema: z.object({
    wardId: z.string().optional().describe("Ward ID filter"),
    category: z.string().optional().describe("Category filter"),
    from: z.string().optional().describe("Start date YYYY-MM-DD"),
    to: z.string().optional().describe("End date YYYY-MM-DD"),
  }),
  outputSchema: z.array(DailyAggregateSchema),
  execute: async (input) => {
    try {
      const rows = await convex.query(api.queries.getDailyAggregates, {
        wardId: input.wardId,
        category: input.category,
        from: input.from,
        to: input.to,
      });
      return rows.map((row: Record<string, unknown>) => DailyAggregateSchema.parse(row));
    } catch {
      return [];
    }
  },
});
