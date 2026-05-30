import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { TrendLineChart } from "./trend-line-chart";
import type { DailyAggregate } from "@311pulse/contracts";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement<{ width?: number; height?: number }> }) =>
      React.cloneElement(children, { width: 800, height: 400 }),
  };
});

const makeAggregate = (date: string, count: number, precipMm: number | null): DailyAggregate => ({
  date,
  wardId: "ward-01",
  category: "garbage",
  count,
  tempC: 20,
  precipMm,
});

describe("TrendLineChart", () => {
  it("renders the chart header when data is present", () => {
    const data = [
      makeAggregate("2026-05-01", 10, 2.5),
      makeAggregate("2026-05-02", 15, 0),
    ];
    render(<TrendLineChart data={data} category="garbage" />);
    expect(screen.getByText(/Request Trend/i)).toBeInTheDocument();
  });

  it("renders a CategoryBadge for the category when provided", () => {
    const data = [makeAggregate("2026-05-01", 10, 2.5)];
    render(<TrendLineChart data={data} category="garbage" />);
    // CategoryBadge renders the label "Garbage"
    expect(screen.getByText("Garbage")).toBeInTheDocument();
  });

  it("renders an SVG chart when precipMm is present", () => {
    const data = [
      makeAggregate("2026-05-01", 10, 2.5),
      makeAggregate("2026-05-02", 15, 0),
      makeAggregate("2026-05-03", 8, 5.1),
    ];
    const { container } = render(<TrendLineChart data={data} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders an SVG chart when precipMm is null for all entries", () => {
    const data = [
      makeAggregate("2026-05-01", 10, null),
      makeAggregate("2026-05-02", 15, null),
    ];
    const { container } = render(<TrendLineChart data={data} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders EmptyState when data is empty", () => {
    render(<TrendLineChart data={[]} />);
    expect(screen.getByText(/no trend data/i)).toBeInTheDocument();
  });
});
