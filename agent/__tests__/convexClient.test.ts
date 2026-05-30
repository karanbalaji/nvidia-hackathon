import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("convex/browser", () => ({
  ConvexHttpClient: vi.fn().mockImplementation((url: string) => ({ url })),
}));

import { getConvexUrl, getConvexClient } from "../convexClient.js";

describe("getConvexUrl", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("throws when CONVEX_URL not set", () => {
    delete process.env.CONVEX_URL;
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    expect(() => getConvexUrl()).toThrow("CONVEX_URL is not set");
  });

  it("returns CONVEX_URL when set", () => {
    process.env.CONVEX_URL = "https://test.convex.cloud";
    expect(getConvexUrl()).toBe("https://test.convex.cloud");
  });

  it("falls back to NEXT_PUBLIC_CONVEX_URL", () => {
    delete process.env.CONVEX_URL;
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://fallback.convex.cloud";
    expect(getConvexUrl()).toBe("https://fallback.convex.cloud");
  });
});

describe("getConvexClient", () => {
  it("returns a ConvexHttpClient instance", () => {
    process.env.CONVEX_URL = "https://test.convex.cloud";
    const client = getConvexClient();
    expect(client).toBeDefined();
  });
});
