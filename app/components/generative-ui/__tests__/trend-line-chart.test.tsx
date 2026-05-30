/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TrendLineChart } from "../trend-line-chart";
import type { DailyAggregate } from "@311pulse/contracts";

vi.mock("recharts", async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: "100%", height: "220px" }}>{children}</div>
    ),
  };
});

const mockTrendData: DailyAggregate[] = [
  {
    date: "2026-05-01",
    wardId: "ward-01",
    category: "pothole",
    count: 5,
    tempC: 15.5,
    precipMm: 12.0,
  },
  {
    date: "2026-05-02",
    wardId: "ward-01",
    category: "pothole",
    count: 8,
    tempC: 16.0,
    precipMm: 0.0,
  },
];

describe("TrendLineChart", () => {
  it("renders the trend title and composed chart container", () => {
    const { container } = render(<TrendLineChart data={mockTrendData} category="pothole" />);
    expect(screen.getByText("Request Trend")).toBeInTheDocument();
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders EmptyState when no data is provided", () => {
    render(<TrendLineChart data={[]} />);
    expect(screen.getByText("No trend data")).toBeInTheDocument();
  });
});
