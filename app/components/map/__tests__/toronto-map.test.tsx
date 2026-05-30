/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TorontoMap from "../toronto-map";
import { MapProvider } from "@/context/map-context";

const mockRegisterMap = vi.fn();
vi.mock("@/context/map-context", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useMap311: () => ({
      registerMap: mockRegisterMap,
    }),
  };
});

vi.mock("react-leaflet", () => {
  const mockMap = { id: "leaflet-map-instance" };
  return {
    MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
    TileLayer: ({ url }: any) => <div data-testid="tile-layer" data-url={url} />,
    useMap: () => mockMap,
  };
});

describe("TorontoMap", () => {
  it("renders map container, tiles, and registers map reference", () => {
    render(
      <MapProvider>
        <TorontoMap>
          <div data-testid="map-child">Child Component</div>
        </TorontoMap>
      </MapProvider>
    );

    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByTestId("tile-layer")).toBeInTheDocument();
    expect(screen.getByTestId("map-child")).toBeInTheDocument();

    // Verify it registered the mock map instance
    expect(mockRegisterMap).toHaveBeenCalledWith({ id: "leaflet-map-instance" });
  });
});
