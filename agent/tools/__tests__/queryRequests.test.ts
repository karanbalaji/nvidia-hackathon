import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../convexClient.js", () => ({
  getConvexClient: vi.fn(),
}));

import { getConvexClient } from "../../convexClient.js";
import { queryRequestsTool } from "../queryRequests.js";

describe("queryRequestsTool", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClient).mockReturnValue({ query: mockQuery } as never);
  });

  const fixture = [{
    date: "2025-03-01", wardId: "ward-03", category: "pothole",
    count: 12, tempC: 5.2, precipMm: 18.0,
  }];

  it("returns daily aggregate rows", async () => {
    mockQuery.mockResolvedValue(fixture);
    expect(await queryRequestsTool.execute!({} as never, {} as never)).toEqual(fixture);
  });

  it("passes all optional filters to Convex", async () => {
    mockQuery.mockResolvedValue(fixture);
    await queryRequestsTool.execute!(
      { wardId: "ward-03", category: "pothole", from: "2025-01-01", to: "2025-12-31" } as never,
      {} as never
    );
    const [, args] = mockQuery.mock.calls[0];
    expect(args).toMatchObject({ wardId: "ward-03", category: "pothole", from: "2025-01-01", to: "2025-12-31" });
  });

  it("returns [] on error", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    expect(await queryRequestsTool.execute!({} as never, {} as never)).toEqual([]);
  });
});
