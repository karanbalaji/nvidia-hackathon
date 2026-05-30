import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MapControls } from "../map-controls";
import { WardProvider } from "@/context/ward-context";

describe("MapControls", () => {
  const defaultProps = {
    activeLayer: "heat" as const,
    onLayerChange: vi.fn(),
    dateRangeDays: 30,
    onDateRangeChange: vi.fn(),
  };

  it("renders category filters, layer toggles, and date ranges", () => {
    render(
      <WardProvider>
        <MapControls {...defaultProps} />
      </WardProvider>
    );

    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Pothole")).toBeInTheDocument();
    expect(screen.getByText("Flooding")).toBeInTheDocument();
    expect(screen.getByText("Heat")).toBeInTheDocument();
    expect(screen.getByText("Hotspots")).toBeInTheDocument();
    expect(screen.getByText("Risk")).toBeInTheDocument();
    // Date range labels are lowercase: "7d", "30d"
    expect(screen.getByText("30d")).toBeInTheDocument();
  });

  it("handles date range change interactions", () => {
    const onDateRangeChange = vi.fn();
    render(
      <WardProvider>
        <MapControls {...defaultProps} onDateRangeChange={onDateRangeChange} />
      </WardProvider>
    );

    fireEvent.click(screen.getByText("7d"));
    expect(onDateRangeChange).toHaveBeenCalledWith(7);
  });
});
