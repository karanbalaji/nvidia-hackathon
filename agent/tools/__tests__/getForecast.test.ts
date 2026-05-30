import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../convexClient.js", () => ({
  getConvexClient: vi.fn(),
}));

import { getConvexClient } from "../../convexClient.js";
import { getForecastTool } from "../getForecast.js";

describe("getForecastTool", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClient).mockReturnValue({ query: mockQuery } as never);
  });

  const fixture = [{
    wardId: "ward-03", category: "pothole",
    horizonStart: "2026-05-31", horizonEnd: "2026-06-07",
    predictedCount: 42, confidenceLow: 33, confidenceHigh: 52, method: "movingavg",
  }];

  it("returns forecast rows", async () => {
    mockQuery.mockResolvedValue(fixture);
    const result = await getForecastTool.execute!({ category: "pothole" } as never, {} as never);
    expect(result).toEqual(fixture);
  });

  it("passes wardId and category to Convex", async () => {
    mockQuery.mockResolvedValue(fixture);
    await getForecastTool.execute!({ wardId: "ward-03", category: "pothole" } as never, {} as never);
    const [, args] = mockQuery.mock.calls[0];
    expect(args).toMatchObject({ wardId: "ward-03", category: "pothole" });
  });

  it("returns [] when Convex returns null", async () => {
    mockQuery.mockResolvedValue(null);
    expect(await getForecastTool.execute!({} as never, {} as never)).toEqual([]);
  });

  it("returns [] on Convex error", async () => {
    mockQuery.mockRejectedValue(new Error("network error"));
    expect(await getForecastTool.execute!({} as never, {} as never)).toEqual([]);
  });
});
