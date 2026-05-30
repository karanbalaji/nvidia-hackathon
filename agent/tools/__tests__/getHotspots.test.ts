import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../convexClient.js", () => ({
  getConvexClient: vi.fn(),
}));

import { getConvexClient } from "../../convexClient.js";
import { getHotspotsTool } from "../getHotspots.js";

describe("getHotspotsTool", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConvexClient).mockReturnValue({ query: mockQuery } as never);
  });

  const fixture = [{
    category: "pothole", wardId: "ward-03",
    neighbourhood: "Etobicoke-Lakeshore",
    centroidLat: 43.63, centroidLng: -79.5, intensity: 0.9, count: 840,
  }];

  it("returns hotspot rows", async () => {
    mockQuery.mockResolvedValue(fixture);
    expect(await getHotspotsTool.execute!({} as never, {} as never)).toEqual(fixture);
  });

  it("passes category filter to Convex", async () => {
    mockQuery.mockResolvedValue(fixture);
    await getHotspotsTool.execute!({ category: "pothole" } as never, {} as never);
    const [, args] = mockQuery.mock.calls[0];
    expect(args).toMatchObject({ category: "pothole" });
  });

  it("returns [] when Convex returns null", async () => {
    mockQuery.mockResolvedValue(null);
    expect(await getHotspotsTool.execute!({} as never, {} as never)).toEqual([]);
  });

  it("returns [] on error", async () => {
    mockQuery.mockRejectedValue(new Error("timeout"));
    expect(await getHotspotsTool.execute!({} as never, {} as never)).toEqual([]);
  });
});
