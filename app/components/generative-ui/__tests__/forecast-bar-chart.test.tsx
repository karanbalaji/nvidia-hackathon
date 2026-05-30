/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ForecastBarChart } from "../forecast-bar-chart";
import type { Forecast } from "@311pulse/contracts";

vi.mock("recharts", async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: "100%", height: "220px" }}>{children}</div>
    ),
  };
});

const mockForecasts: Forecast[] = [
  {
    wardId: "ward-01",
    category: "pothole",
    horizonStart: "2026-06-01",
    horizonEnd: "2026-06-07",
    predictedCount: 42,
    confidenceLow: 35,
    confidenceHigh: 50,
    method: "movingavg",
  },
  {
    wardId: "ward-02",
    category: "pothole",
    horizonStart: "2026-06-01",
    horizonEnd: "2026-06-07",
    predictedCount: 38,
    confidenceLow: 30,
    confidenceHigh: 46,
    method: "movingavg",
  },
];

describe("ForecastBarChart", () => {
  it("renders the forecast title and bar chart container", () => {
    const { container } = render(<ForecastBarChart data={mockForecasts} title="Potholes Forecast" />);
    expect(screen.getByText("Potholes Forecast")).toBeInTheDocument();
    
    // Assert that recharts-wrapper container is rendered
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders EmptyState when no data is provided", () => {
    render(<ForecastBarChart data={[]} />);
    expect(screen.getByText("No forecast data")).toBeInTheDocument();
  });
});
