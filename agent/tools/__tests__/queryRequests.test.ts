import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DailyAggregate } from "@311pulse/contracts";
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

const MOCK_AGGREGATE = {
  date: "2026-01-15",
  wardId: "ward-02",
  category: "garbage",
  count: 12,
  tempC: -3.5,
  precipMm: 2.1,
};

const ctx = {} as ToolExecutionContext;

function asAggregates(r: unknown): DailyAggregate[] {
  return r as DailyAggregate[];
}

describe("queryRequestsTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns daily aggregates from Convex", async () => {
    const { convex } = await import("../../convexClient.js");
    vi.mocked(convex.query).mockResolvedValue([MOCK_AGGREGATE]);

    const { queryRequestsTool } = await import("../queryRequests.js");
    const result = asAggregates(
      await queryRequestsTool.execute!(
        { category: "garbage", from: "2026-01-01", to: "2026-01-31" },
        ctx
      )
    );

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-01-15");
    expect(result[0].count).toBe(12);
    expect(convex.query).toHaveBeenCalledWith("queries:getDailyAggregates", {
      category: "garbage",
      wardId: undefined,
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("handles null weather fields (precipMm / tempC)", async () => {
    const { convex } = await import("../../convexClient.js");
    vi.mocked(convex.query).mockResolvedValue([
      { ...MOCK_AGGREGATE, tempC: null, precipMm: null },
    ]);

    const { queryRequestsTool } = await import("../queryRequests.js");
    const result = asAggregates(await queryRequestsTool.execute!({}, ctx));

    expect(result[0].tempC).toBeNull();
    expect(result[0].precipMm).toBeNull();
  });

  it("returns empty array on error", async () => {
    const { convex } = await import("../../convexClient.js");
    vi.mocked(convex.query).mockRejectedValue(new Error("network error"));

    const { queryRequestsTool } = await import("../queryRequests.js");
    const result = asAggregates(await queryRequestsTool.execute!({}, ctx));
    expect(result).toEqual([]);
  });
});
