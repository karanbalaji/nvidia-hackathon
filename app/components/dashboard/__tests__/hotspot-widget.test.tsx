import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HotspotWidget } from "../hotspot-widget";
import { useQuery } from "convex/react";
import { WardProvider } from "@/context/ward-context";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/../convex/_generated/api", () => ({
  api: {
    queries: {
      getHotspots: "getHotspots",
    },
  },
}));

describe("HotspotWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when query is loading", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    render(
      <WardProvider>
        <HotspotWidget />
      </WardProvider>
    );
    // Should render chart skeleton animation container
    expect(screen.getByTestId("chart-skeleton")).toBeInTheDocument();
  });

  it("renders hotspots when data is returned", () => {
    vi.mocked(useQuery).mockReturnValue([
      {
        category: "pothole",
        wardId: "ward-01",
        neighbourhood: "Rexdale",
        centroidLat: 43.72,
        centroidLng: -79.60,
        intensity: 0.8,
        count: 24,
      },
    ]);

    render(
      <WardProvider>
        <HotspotWidget />
      </WardProvider>
    );

    expect(screen.getByText("TOP PREDICTED HOTSPOTS")).toBeInTheDocument();
    expect(screen.getByText("Rexdale")).toBeInTheDocument();
  });
});
