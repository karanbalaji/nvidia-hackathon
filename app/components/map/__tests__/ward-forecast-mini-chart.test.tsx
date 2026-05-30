/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WardForecastMiniChart } from "../ward-forecast-mini-chart";

vi.mock("recharts", async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: "100%", height: "220px" }}>{children}</div>
    ),
  };
});

describe("WardForecastMiniChart", () => {
  const mockData = [
    { date: "2026-05-30", count: 12 },
    { date: "2026-05-31", count: 15 },
    { date: "2026-06-01", count: 18 },
    { date: "2026-06-02", count: 14 },
    { date: "2026-06-03", count: 20 },
    { date: "2026-06-04", count: 22 },
    { date: "2026-06-05", count: 25 },
  ];

  it("renders without crashing", () => {
    const { container } = render(<WardForecastMiniChart data={mockData} />);
    // Check if recharts-wrapper is present in DOM
    const wrapper = container.querySelector(".recharts-wrapper");
    expect(wrapper).toBeInTheDocument();
  });
});
