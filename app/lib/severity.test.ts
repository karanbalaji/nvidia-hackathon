import { describe, it, expect } from "vitest";
import { severityBand } from "./severity";

describe("severityBand", () => {
  it("maps the low band (0-20)", () => {
    expect(severityBand(0).key).toBe("low");
    expect(severityBand(20).key).toBe("low");
    expect(severityBand(20).label).toBe("Low");
  });

  it("maps the guarded band (21-40)", () => {
    expect(severityBand(21).key).toBe("guarded");
    expect(severityBand(40).key).toBe("guarded");
  });

  it("maps the elevated band (41-60)", () => {
    expect(severityBand(41).key).toBe("elevated");
    expect(severityBand(60).key).toBe("elevated");
  });

  it("maps the high band (61-80)", () => {
    expect(severityBand(61).key).toBe("high");
    expect(severityBand(80).key).toBe("high");
  });

  it("maps the severe band (81-100)", () => {
    expect(severityBand(81).key).toBe("severe");
    expect(severityBand(100).key).toBe("severe");
    expect(severityBand(100).label).toBe("Severe");
  });

  it("returns a hex color for every band", () => {
    [10, 30, 50, 70, 90].forEach((s) => {
      expect(severityBand(s).hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
