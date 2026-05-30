import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../convexClient.js", () => ({
  getConvexClient: vi.fn(),
}));

import { getConvexClient } from "../../convexClient.js";
import { getRiskScoreTool } from "../getRiskScore.js";

describe("getRiskScoreTool", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClient).mockReturnValue({ query: mockQuery } as never);
  });

  const fixture = [{
    wardId: "ward-03", category: "flooding", score: 78,
    drivers: ["heavy rain forecast", "rising 14-day trend"], asOf: "2026-05-30",
  }];

  it("returns risk score rows", async () => {
    mockQuery.mockResolvedValue(fixture);
    expect(await getRiskScoreTool.execute!({} as never, {} as never)).toEqual(fixture);
  });

  it("every row has non-empty drivers array", async () => {
    mockQuery.mockResolvedValue(fixture);
    const result = await getRiskScoreTool.execute!({} as never, {} as never) as typeof fixture;
    expect(result.every(r => r.drivers.length > 0)).toBe(true);
  });

  it("passes wardId filter", async () => {
    mockQuery.mockResolvedValue(fixture);
    await getRiskScoreTool.execute!({ wardId: "ward-03" } as never, {} as never);
    const [, args] = mockQuery.mock.calls[0];
    expect(args).toMatchObject({ wardId: "ward-03" });
  });

  it("returns [] on error", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    expect(await getRiskScoreTool.execute!({} as never, {} as never)).toEqual([]);
  });
});
