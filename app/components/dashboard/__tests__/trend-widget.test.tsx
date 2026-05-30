/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrendWidget } from "../trend-widget";
import { useQuery } from "convex/react";
import { WardProvider } from "@/context/ward-context";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/../convex/_generated/api", () => ({
  api: {
    queries: {
      getDailyAggregates: "getDailyAggregates",
    },
  },
}));

vi.mock("recharts", async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: "100%", height: "220px" }}>{children}</div>
    ),
  };
});

describe("TrendWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when loading", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    render(
      <WardProvider>
        <TrendWidget />
      </WardProvider>
    );
    expect(screen.getByTestId("chart-skeleton")).toBeInTheDocument();
  });

  it("renders trend widget when data is returned", () => {
    vi.mocked(useQuery).mockReturnValue([
      {
        date: "2026-05-01",
        wardId: "ward-01",
        category: "pothole",
        count: 5,
        tempC: 15,
        precipMm: 2,
      },
    ]);

    render(
      <WardProvider>
        <TrendWidget />
      </WardProvider>
    );

    expect(screen.getByText("CITY-WIDE COMPLAINT TREND")).toBeInTheDocument();
  });
});
