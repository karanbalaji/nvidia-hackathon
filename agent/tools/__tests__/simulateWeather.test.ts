import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../convexClient.js", () => ({
  getConvexClient: vi.fn(),
}));

import { getConvexClient } from "../../convexClient.js";
import { simulateWeatherTool } from "../simulateWeather.js";

describe("simulateWeatherTool", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClient).mockReturnValue({ query: mockQuery } as never);
  });

  const baseForecast = [{
    wardId: "ward-03", category: "flooding",
    horizonStart: "2026-05-31", horizonEnd: "2026-06-07",
    predictedCount: 20, confidenceLow: 16, confidenceHigh: 25, method: "movingavg",
  }];

  it("returns an array of Forecast objects", async () => {
    mockQuery.mockResolvedValue(baseForecast);
    const result = await simulateWeatherTool.execute!({ scenario: "heavy_rain" } as never, {} as never) as any[];
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("wardId");
    expect(result[0]).toHaveProperty("predictedCount");
  });

  it("heavy_rain increases predictedCount vs baseline", async () => {
    mockQuery.mockResolvedValue(baseForecast);
    const result = await simulateWeatherTool.execute!({ scenario: "heavy_rain" } as never, {} as never) as any[];
    expect(result[0].predictedCount).toBeGreaterThan(20);
  });

  it("dry_spell decreases predictedCount vs baseline", async () => {
    mockQuery.mockResolvedValue(baseForecast);
    const result = await simulateWeatherTool.execute!({ scenario: "dry_spell" } as never, {} as never) as any[];
    expect(result[0].predictedCount).toBeLessThan(20);
  });

  it("returns [] when no baseline data", async () => {
    mockQuery.mockResolvedValue([]);
    expect(await simulateWeatherTool.execute!({ scenario: "heavy_rain" } as never, {} as never)).toEqual([]);
  });
});
