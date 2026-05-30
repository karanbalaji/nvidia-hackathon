import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MapControls } from "../map-controls";
import { WardProvider } from "@/context/ward-context";
import { MapProvider } from "@/context/map-context";

describe("MapControls", () => {
  it("renders category filters, layer toggles, and date ranges", () => {
    const setDateRange = vi.fn();
    render(
      <WardProvider>
        <MapProvider>
          <MapControls dateRange="30d" setDateRange={setDateRange} />
        </MapProvider>
      </WardProvider>
    );

    // Categories
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Pothole")).toBeInTheDocument();
    expect(screen.getByText("Flooding")).toBeInTheDocument();

    // Layer indicators
    expect(screen.getByText("Heat")).toBeInTheDocument();
    expect(screen.getByText("Hotspots")).toBeInTheDocument();
    expect(screen.getByText("Risk")).toBeInTheDocument();

    // Date range selected state
    const d30Btn = screen.getByText("30D");
    expect(d30Btn).toBeInTheDocument();
  });

  it("handles interactions correctly", () => {
    const setDateRange = vi.fn();
    render(
      <WardProvider>
        <MapProvider>
          <MapControls dateRange="30d" setDateRange={setDateRange} />
        </MapProvider>
      </WardProvider>
    );

    // Clicking category
    const floodingBtn = screen.getByText("Flooding");
    fireEvent.click(floodingBtn);

    // Clicking date range
    const d7Btn = screen.getByText("7D");
    fireEvent.click(d7Btn);
    expect(setDateRange).toHaveBeenCalledWith("7d");
  });
});
