import { describe, it, expect } from "vitest";
import { pearson } from "./correlation";

describe("pearson", () => {
  it("returns 1 for perfectly positively correlated series", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 5);
  });

  it("returns -1 for perfectly negatively correlated series", () => {
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 5);
  });

  it("returns null when there are fewer than 3 paired points", () => {
    expect(pearson([1, 2], [2, 4])).toBeNull();
  });

  it("returns null when a series has zero variance", () => {
    expect(pearson([1, 1, 1, 1], [1, 2, 3, 4])).toBeNull();
  });

  it("returns a value between -1 and 1 for noisy data", () => {
    const r = pearson([1, 2, 3, 4, 5], [2, 1, 4, 3, 6]);
    expect(r).not.toBeNull();
    expect(r as number).toBeGreaterThanOrEqual(-1);
    expect(r as number).toBeLessThanOrEqual(1);
  });
});
