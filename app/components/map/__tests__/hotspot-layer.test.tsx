/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HotspotLayer } from "../hotspot-layer";
import type { Hotspot } from "@311pulse/contracts";

vi.mock("react-leaflet", () => ({
  CircleMarker: ({ center, radius, pathOptions, children }: any) => (
    <div
      data-testid="circle-marker"
      data-center={JSON.stringify(center)}
      data-radius={radius}
      data-color={pathOptions?.fillColor}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
}));

describe("HotspotLayer", () => {
  const mockHotspots: Hotspot[] = [
    {
      category: "pothole",
      wardId: "ward-01",
      neighbourhood: "Rexdale",
      centroidLat: 43.72,
      centroidLng: -79.60,
      intensity: 0.8,
      count: 24,
    },
    {
      category: "pothole",
      wardId: "ward-02",
      neighbourhood: "Etobicoke",
      centroidLat: 43.68,
      centroidLng: -79.55,
      intensity: 0.4,
      count: 12,
    },
  ];

  it("renders circle markers for each hotspot with mapped properties", () => {
    render(<HotspotLayer data={mockHotspots} category="pothole" />);

    const markers = screen.getAllByTestId("circle-marker");
    expect(markers).toHaveLength(2);

    // Mapped radius: 8 + intensity * 16. Mapped colors: category = pothole => amber color.
    expect(markers[0]).toHaveAttribute("data-radius", "20.8"); // 8 + 0.8 * 16 = 20.8
    expect(markers[1]).toHaveAttribute("data-radius", "14.4"); // 8 + 0.4 * 16 = 14.4
  });

  it("renders nothing if data is empty", () => {
    const { container } = render(<HotspotLayer data={[]} category="pothole" />);
    expect(container.firstChild).toBeNull();
  });
});
