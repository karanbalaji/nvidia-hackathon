import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WardForecastMiniChart } from "../ward-forecast-mini-chart";
import type { Forecast } from "@311pulse/contracts";

describe("WardForecastMiniChart", () => {
  const mockData: Forecast[] = [
    { wardId: "ward-14", category: "pothole", horizonStart: "2026-05-30", horizonEnd: "2026-06-06", predictedCount: 12, confidenceLow: 8, confidenceHigh: 16, method: "movingavg" },
    { wardId: "ward-14", category: "pothole", horizonStart: "2026-05-31", horizonEnd: "2026-06-07", predictedCount: 15, confidenceLow: 10, confidenceHigh: 20, method: "movingavg" },
  ];

  it("renders without crashing with forecast data", () => {
    const { container } = render(<WardForecastMiniChart data={mockData} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders empty state when no data", () => {
    const { container } = render(<WardForecastMiniChart data={[]} />);
    expect(container.firstChild).not.toBeNull();
  });
});
