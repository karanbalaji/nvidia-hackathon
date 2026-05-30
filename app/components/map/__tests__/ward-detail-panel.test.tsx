import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WardDetailPanel } from "../ward-detail-panel";
import type { RiskScore, Forecast, DailyAggregate } from "@311pulse/contracts";

vi.mock("convex/react", () => ({ useQuery: vi.fn() }));
vi.mock("@copilotkit/react-core", () => ({
  useCopilotChat: () => ({ appendMessage: vi.fn() }),
}));
vi.mock("@/lib/convex", () => ({ api: { queries: {} } }));

const { useQuery } = await import("convex/react");

const mockRisk: RiskScore = {
  wardId: "ward-14", category: "pothole", score: 75,
  drivers: ["Precipitation", "Freeze-thaw cycles"], asOf: "2026-05-30",
};
const mockForecast: Forecast = {
  wardId: "ward-14", category: "pothole", horizonStart: "2026-05-30",
  horizonEnd: "2026-06-06", predictedCount: 45, confidenceLow: 38,
  confidenceHigh: 52, method: "movingavg",
};
const mockAgg: DailyAggregate = {
  date: "2026-05-30", wardId: "ward-14", category: "pothole",
  count: 5, tempC: 18, precipMm: 0,
};

describe("WardDetailPanel", () => {
  it("renders ward details and close button works when wardId provided", () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce([mockRisk])     // riskScores
      .mockReturnValueOnce([mockForecast]) // forecasts
      .mockReturnValueOnce([mockAgg]);     // dailyAggs

    const onClose = vi.fn();
    render(<WardDetailPanel wardId="ward-14" onClose={onClose} />);

    expect(screen.getByText("ward-14")).toBeInTheDocument();
    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders null when wardId is null", () => {
    const { container } = render(
      <WardDetailPanel wardId={null} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });
});
