import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConvexClient } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

export const getRiskScoreTool = createTool({
  id: "getRiskScore",
  description:
    "Composite 0–100 risk score per ward with human-readable driver labels. Use when asked which wards are at highest risk, why a ward is flagged, or to prioritise resource allocation.",
  inputSchema: z.object({
    wardId: z.string().optional(),
  }),
  execute: async (inputData) => {
    try {
      const result = await getConvexClient().query(api.queries.getRiskScores, {
        wardId: inputData.wardId,
      });
      return result ?? [];
    } catch (err) {
      console.error("[getRiskScore] Convex query failed:", (err as Error).message);
      return [];
    }
  },
});
