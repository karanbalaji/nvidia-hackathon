import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RiskWidget } from "../risk-widget";
import { useQuery } from "convex/react";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/../convex/_generated/api", () => ({
  api: {
    queries: {
      getRiskScores: "getRiskScores",
    },
  },
}));

describe("RiskWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when loading", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    render(<RiskWidget />);
    expect(screen.getByTestId("chart-skeleton")).toBeInTheDocument();
  });

  it("renders risk widget when data is returned", () => {
    vi.mocked(useQuery).mockReturnValue([
      {
        wardId: "ward-14",
        category: "flooding",
        score: 90,
        drivers: ["Heavy Rainfall"],
        asOf: "2026-05-30",
      },
    ]);

    render(<RiskWidget />);

    expect(screen.getByText("HIGHEST PREDICTIVE RISK")).toBeInTheDocument();
    expect(screen.getByText("ward-14".toUpperCase())).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
  });
});
