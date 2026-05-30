import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getConvexClient } from "../convexClient";
import { api } from "../../convex/_generated/api";

const MULTIPLIERS: Record<string, number> = {
  heavy_rain: 1.4,
  light_rain: 1.15,
  dry_spell: 0.7,
  heat_wave: 1.2,
  normal: 1.0,
};

export const simulateWeatherTool = createTool({
  id: "simulateWeather",
  description:
    "Simulate how a weather scenario (heavy_rain, dry_spell, heat_wave, light_rain, normal) would affect 311 request counts. Use for 'what if' planning questions.",
  inputSchema: z.object({
    scenario: z.enum(["heavy_rain", "light_rain", "dry_spell", "heat_wave", "normal"]),
    category: z.string().optional(),
  }),
  execute: async (params) => {
    try {
      const input = ((params as { context?: unknown })?.context ?? params ?? {}) as {
        scenario: string;
        category?: string;
      };
      const args: { category?: string } = {};
      if (input.category) args.category = input.category;
      const baseline = await getConvexClient().query(api.queries.getForecast, args);
      if (!baseline || baseline.length === 0) return [];
      const multiplier = MULTIPLIERS[input.scenario] ?? 1.0;
      return baseline.map((f: any) => ({
        ...f,
        predictedCount: Math.round(f.predictedCount * multiplier),
        confidenceLow: Math.round(f.confidenceLow * multiplier),
        confidenceHigh: Math.round(f.confidenceHigh * multiplier),
        method: `simulated-${input.scenario}`,
      }));
    } catch (err) {
      console.error("[simulateWeather] failed:", (err as Error).message);
      return [];
    }
  },
});
