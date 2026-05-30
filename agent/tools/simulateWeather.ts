import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { ForecastSchema } from "@311pulse/contracts";
import { convex } from "../convexClient.js";
import { api } from "../../convex/_generated/api.js";

const SCENARIO_MULTIPLIERS: Record<string, number> = {
  heavy_rain: 1.4,
  drought: 0.7,
  heat_wave: 1.2,
  freeze_thaw: 1.6,
};

export const simulateWeatherTool = createTool({
  id: "simulateWeather",
  description:
    "Simulates how a weather scenario (heavy_rain, drought, heat_wave, freeze_thaw) adjusts forecast counts. Returns adjusted Forecast[] for before/after comparisons.",
  inputSchema: z.object({
    scenario: z
      .string()
      .describe("Scenario: heavy_rain | drought | heat_wave | freeze_thaw"),
    category: z.string().optional().describe("Category filter"),
  }),
  outputSchema: z.array(ForecastSchema),
  execute: async (input) => {
    try {
      const base = await convex.query(api.queries.getForecast, {
        category: input.category,
      });
      const multiplier = SCENARIO_MULTIPLIERS[input.scenario] ?? 1.0;
      return base.map((row: Record<string, unknown>) => {
        const f = ForecastSchema.parse(row);
        return {
          ...f,
          predictedCount: Math.round(f.predictedCount * multiplier),
          confidenceLow: Math.round(f.confidenceLow * multiplier),
          confidenceHigh: Math.round(f.confidenceHigh * multiplier),
          method: `scenario-${input.scenario}`,
        };
      });
    } catch {
      return [];
    }
  },
});
