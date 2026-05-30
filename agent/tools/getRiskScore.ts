import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { RiskScoreSchema } from "@311pulse/contracts";
import { convex } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

export const getRiskScoreTool = createTool({
  id: "getRiskScore",
  description:
    "Composite risk scores (0–100) per ward, with human-readable driver explanations. Use when asked about high-risk wards, alert priorities, or weather-driven risk.",
  inputSchema: z.object({
    wardId: z.string().optional().describe("Ward ID filter"),
  }),
  outputSchema: z.array(RiskScoreSchema),
  execute: async (input) => {
    try {
      const rows = await convex.query(api.queries.getRiskScores, {
        wardId: input.wardId,
      });
      return rows.map((row: Record<string, unknown>) => RiskScoreSchema.parse(row));
    } catch {
      return [];
    }
  },
});
