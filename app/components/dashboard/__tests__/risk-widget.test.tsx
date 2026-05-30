import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RiskWidget } from "../risk-widget";
import { useQuery } from "convex/react";
import { WardProvider } from "@/context/ward-context";

vi.mock("convex/react", () => ({ useQuery: vi.fn() }));
vi.mock("@/../convex/_generated/api", () => ({
  api: { queries: { getRiskScores: "getRiskScores" } },
}));

describe("RiskWidget", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders loading skeleton when loading", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    render(<WardProvider><RiskWidget /></WardProvider>);
    expect(screen.getByTestId("chart-skeleton")).toBeInTheDocument();
  });

  it("renders risk widget when data is returned", () => {
    vi.mocked(useQuery).mockReturnValue([
      { wardId: "ward-14", category: "flooding", score: 90,
        drivers: ["Heavy Rainfall"], asOf: "2026-05-30" },
    ]);
    render(<WardProvider><RiskWidget /></WardProvider>);
    // Widget header: "Highest-Risk Wards"
    expect(screen.getByText("Highest-Risk Wards")).toBeInTheDocument();
    // RiskPanel shows wardId directly: "ward-14"
    expect(screen.getByText("ward-14")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
  });
});
