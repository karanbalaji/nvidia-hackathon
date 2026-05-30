import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HotspotMapAction } from "../hotspot-map-action";
import type { Hotspot } from "@311pulse/contracts";

const mockPushHeatLayer = vi.fn();
const mockSetActiveLayer = vi.fn();

vi.mock("@/context/map-context", () => ({
  useMap311: () => ({
    pushHeatLayer: mockPushHeatLayer,
    setActiveLayer: mockSetActiveLayer,
    highlightWards: vi.fn(),
    clearHighlights: vi.fn(),
    registerMap: vi.fn(),
  }),
}));

const mockHotspots: Hotspot[] = [
  { category: "pothole", wardId: "ward-01", neighbourhood: "Humber Summit",
    centroidLat: 43.74, centroidLng: -79.59, intensity: 0.88, count: 34 },
  { category: "pothole", wardId: "ward-02", neighbourhood: "Birchcliffe",
    centroidLat: 43.69, centroidLng: -79.26, intensity: 0.72, count: 28 },
];

describe("HotspotMapAction", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls pushHeatLayer and setActiveLayer on mount", () => {
    render(<HotspotMapAction data={mockHotspots} category="pothole" />);
    expect(mockPushHeatLayer).toHaveBeenCalledWith(mockHotspots);
    expect(mockSetActiveLayer).toHaveBeenCalledWith("hotspot");
  });

  it("renders the table of top hotspots", () => {
    render(<HotspotMapAction data={mockHotspots} category="pothole" />);
    // Component shows "Hotspot Clusters" (title case, not uppercase)
    expect(screen.getByText("Hotspot Clusters")).toBeInTheDocument();
    expect(screen.getByText("Humber Summit")).toBeInTheDocument();
    expect(screen.getByText("Birchcliffe")).toBeInTheDocument();
  });

  it("renders empty component when no data is provided", () => {
    render(<HotspotMapAction data={[]} />);
    // Component renders (no crash) but shows 0 clusters
    expect(screen.getByText("Hotspot Clusters")).toBeInTheDocument();
  });
});
