import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ForecastSchema } from "@311pulse/contracts";
import { convex } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

export const getForecastTool = createTool({
  id: "getForecast",
  description:
    "Predicted 311 request counts per ward for a category over the next 7 days. Use for 'which wards will see most X next week?' questions.",
  inputSchema: z.object({
    wardId: z.string().optional().describe("Ward ID (e.g. ward-01). Omit for all wards."),
    category: z
      .string()
      .optional()
      .describe("Category: pothole | garbage | flooding | noise. Omit for all."),
  }),
  outputSchema: z.array(ForecastSchema),
  execute: async (input) => {
    try {
      const rows = await convex.query(api.queries.getForecast, {
        wardId: input.wardId,
        category: input.category,
      });
      return rows.map((row: Record<string, unknown>) => ForecastSchema.parse(row));
    } catch {
      return [];
    }
  },
});
