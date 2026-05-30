import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Forecast } from "@311pulse/contracts";
import type { ToolExecutionContext } from "@mastra/core/tools";

vi.mock("../../convexClient.js", () => ({
  convex: { query: vi.fn() },
}));

vi.mock("../../../convex/_generated/api.js", () => ({
  api: {
    queries: {
      getForecast: "queries:getForecast",
      getDailyAggregates: "queries:getDailyAggregates",
      getHotspots: "queries:getHotspots",
      getRiskScores: "queries:getRiskScores",
    },
  },
}));

const MOCK_FORECAST = {
  wardId: "ward-01",
  category: "pothole",
  horizonStart: "2026-06-01",
  horizonEnd: "2026-06-07",
  predictedCount: 42,
  confidenceLow: 35,
  confidenceHigh: 50,
  method: "movingavg",
};

// Minimal execution context satisfying Mastra's ToolExecutionContext type
const ctx = {} as ToolExecutionContext;

function asForecast(r: unknown): Forecast[] {
  return r as Forecast[];
}

describe("getForecastTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forecast rows from Convex, stripping internal fields", async () => {
    const { convex } = await import("../../convexClient.js");
    vi.mocked(convex.query).mockResolvedValue([
      { ...MOCK_FORECAST, _id: "abc123", _creationTime: 1234567890 },
    ]);

    const { getForecastTool } = await import("../getForecast.js");
    const result = asForecast(
      await getForecastTool.execute!({ category: "pothole" }, ctx)
    );

    expect(result).toHaveLength(1);
    expect(result[0].wardId).toBe("ward-01");
    expect(result[0].predictedCount).toBe(42);
    // Zod schema strips Convex internal fields
    expect((result[0] as Record<string, unknown>)._id).toBeUndefined();
    expect(convex.query).toHaveBeenCalledWith("queries:getForecast", {
      wardId: undefined,
      category: "pothole",
    });
  });

  it("returns empty array when Convex returns no data", async () => {
    const { convex } = await import("../../convexClient.js");
    vi.mocked(convex.query).mockResolvedValue([]);

    const { getForecastTool } = await import("../getForecast.js");
    const result = asForecast(await getForecastTool.execute!({}, ctx));
    expect(result).toEqual([]);
  });

  it("returns empty array on Convex error (reliability requirement)", async () => {
    const { convex } = await import("../../convexClient.js");
    vi.mocked(convex.query).mockRejectedValue(new Error("Convex timeout"));

    const { getForecastTool } = await import("../getForecast.js");
    const result = asForecast(await getForecastTool.execute!({}, ctx));
    expect(result).toEqual([]);
  });

  it("tool has correct id and description", async () => {
    const { getForecastTool } = await import("../getForecast.js");
    expect(getForecastTool.id).toBe("getForecast");
    expect(getForecastTool.description).toContain("next 7 days");
  });
});
