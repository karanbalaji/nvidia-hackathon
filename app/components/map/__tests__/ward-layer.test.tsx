/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WardLayer } from "../ward-layer";
import type { RiskScore } from "@311pulse/contracts";

// Mock react-leaflet
vi.mock("react-leaflet", () => ({
  GeoJSON: ({ data, style }: any) => {
    // Call the style function for each feature to verify styling in test
    const featureStyle = style(data.features[0]);
    return (
      <div
        data-testid="mock-geojson"
        data-fill-color={featureStyle.fillColor}
        data-fill-opacity={featureStyle.fillOpacity}
      />
    );
  },
}));

// Mock MapContext
const mockHighlightedWardIds = vi.fn().mockReturnValue([]);
vi.mock("@/context/map-context", () => ({
  useMap311: () => ({
    highlightedWardIds: mockHighlightedWardIds(),
    activeLayer: "heat",
  }),
}));

describe("WardLayer", () => {
  const mockGeoJson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { wardId: "ward-01", name: "Ward 1" },
        geometry: {
          type: "Polygon",
          coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
        },
      },
    ],
  };


  const mockRiskData: RiskScore[] = [
    {
      wardId: "ward-01",
      category: "pothole",
      score: 85, // Severe => #EF4444
      drivers: [],
      asOf: "2026-05-30",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockHighlightedWardIds.mockReturnValue([]);
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGeoJson),
    });
  });

  it("fetches and renders GeoJSON boundaries with correct styles for risk", async () => {
    render(
      <WardLayer
        activeLayer="risk"
        heatData={[]}
        riskData={mockRiskData}
        onWardClick={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/wards-geojson");
    });

    const geoJsonEl = await screen.findByTestId("mock-geojson");
    expect(geoJsonEl).toBeInTheDocument();
    // 85 is severe risk, so it should map to #EF4444
    expect(geoJsonEl).toHaveAttribute("data-fill-color", "#EF4444");
  });

  it("applies highlight style when ward ID is highlighted", async () => {
    mockHighlightedWardIds.mockReturnValue(["ward-01"]);
    render(
      <WardLayer
        activeLayer="none"
        heatData={[]}
        riskData={[]}
        onWardClick={vi.fn()}
      />
    );

    const geoJsonEl = await screen.findByTestId("mock-geojson");
    expect(geoJsonEl).toBeInTheDocument();
    // Highlighted fill should be vibrant blue (#1E5EFF)
    expect(geoJsonEl).toHaveAttribute("data-fill-color", "#1E5EFF");
  });
});
