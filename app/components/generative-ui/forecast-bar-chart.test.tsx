import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ForecastBarChart } from "./forecast-bar-chart";
import type { Forecast } from "@311pulse/contracts";

// Recharts uses ResizeObserver and measures DOM — provide a stub class
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

// Mock ResponsiveContainer to render children with fixed dimensions so Recharts
// can paint in jsdom (which has no layout engine and reports 0-width for everything)
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement<{ width?: number; height?: number }> }) =>
      React.cloneElement(children, { width: 800, height: 400 }),
  };
});

const makeForecast = (wardId: string, count: number): Forecast => ({
  wardId,
  category: "pothole",
  horizonStart: "2026-06-01",
  horizonEnd: "2026-06-07",
  predictedCount: count,
  confidenceLow: count * 0.8,
  confidenceHigh: count * 1.2,
  method: "prophet",
});

describe("ForecastBarChart", () => {
  it("renders the chart header when data is present", () => {
    const data = [
      makeForecast("ward-01", 100),
      makeForecast("ward-02", 80),
      makeForecast("ward-03", 60),
    ];
    render(<ForecastBarChart data={data} />);
    expect(screen.getByText(/7-Day Horizon/i)).toBeInTheDocument();
    expect(screen.getByText(/Forecast/i)).toBeInTheDocument();
  });

  it("renders the category badge with the data's category", () => {
    const data = [makeForecast("ward-01", 100)];
    render(<ForecastBarChart data={data} />);
    expect(screen.getByText("pothole")).toBeInTheDocument();
  });

  it("renders EmptyState when data is empty", () => {
    render(<ForecastBarChart data={[]} />);
    expect(screen.getByText(/no forecast data/i)).toBeInTheDocument();
  });

  it("renders EmptyState suggestion when data is empty", () => {
    render(<ForecastBarChart data={[]} />);
    expect(screen.getByText(/try a different category or ward/i)).toBeInTheDocument();
  });
});
