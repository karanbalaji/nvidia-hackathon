import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HotspotWidget } from "../hotspot-widget";
import { useQuery } from "convex/react";
import { WardProvider } from "@/context/ward-context";

vi.mock("convex/react", () => ({ useQuery: vi.fn() }));
vi.mock("@/../convex/_generated/api", () => ({
  api: { queries: { getHotspots: "getHotspots", getForecast: "getForecast" } },
}));

describe("HotspotWidget", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders loading skeleton when query is loading", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    render(<WardProvider><HotspotWidget /></WardProvider>);
    expect(screen.getByTestId("chart-skeleton")).toBeInTheDocument();
  });

  it("renders hotspots when data is returned", () => {
    vi.mocked(useQuery).mockReturnValue([
      { wardId: "ward-01", category: "pothole", neighbourhood: "Rexdale",
        centroidLat: 43.72, centroidLng: -79.60, intensity: 0.8, count: 24,
        predictedCount: 24, horizonStart: "2026-05-30", horizonEnd: "2026-06-06",
        confidenceLow: 18, confidenceHigh: 30, method: "movingavg" },
    ]);
    render(<WardProvider><HotspotWidget /></WardProvider>);
    // Widget renders ForecastBarChart with title "Top Predicted Hotspots"
    // Widget header text (the widget title, distinct from ForecastBarChart's default title)
    expect(screen.getByText("Top Predicted Hotspots")).toBeInTheDocument();
  });
});
