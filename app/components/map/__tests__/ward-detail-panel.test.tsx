/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WardDetailPanel } from "../ward-detail-panel";
import type { Ward, RiskScore, Forecast } from "@311pulse/contracts";

vi.mock("recharts", async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: "100%", height: "100px" }}>{children}</div>
    ),
  };
});

describe("WardDetailPanel", () => {
  const mockWard: Ward = {
    wardId: "ward-14",
    wardName: "Toronto-Danforth",
    neighbourhoods: ["Danforth", "Riverdale", "Leslieville"],
  };

  const mockRiskScore: RiskScore = {
    wardId: "ward-14",
    category: "pothole",
    score: 75,
    drivers: ["Precipitation", "Freeze-thaw cycles"],
    asOf: "2026-05-30",
  };

  const mockForecast: Forecast = {
    wardId: "ward-14",
    category: "pothole",
    horizonStart: "2026-05-30",
    horizonEnd: "2026-06-06",
    predictedCount: 45,
    confidenceLow: 38,
    confidenceHigh: 52,
    method: "xgboost",
  };

  const mockMiniChartData = [
    { date: "2026-05-30", count: 5 },
    { date: "2026-05-31", count: 8 },
  ];

  it("renders ward details, risk scores, and calling close button works", () => {
    const onClose = vi.fn();
    render(
      <WardDetailPanel
        ward={mockWard}
        riskScore={mockRiskScore}
        forecast={mockForecast}
        miniChartData={mockMiniChartData}
        onClose={onClose}
      />
    );

    expect(screen.getByText("Toronto-Danforth")).toBeInTheDocument();
    expect(screen.getByText("WARD 14")).toBeInTheDocument();
    expect(screen.getByText("Leslieville")).toBeInTheDocument();
    expect(screen.getByText("High Risk")).toBeInTheDocument(); // 75 is "High"

    // Click close button
    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders null if ward is null", () => {
    const { container } = render(
      <WardDetailPanel
        ward={null}
        riskScore={null}
        forecast={null}
        miniChartData={[]}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
