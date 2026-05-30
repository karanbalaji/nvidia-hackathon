import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MapLegend } from "../map-legend";

const mockActiveLayer = vi.fn().mockReturnValue("heat");

vi.mock("@/context/map-context", () => ({
  useMap311: () => ({
    activeLayer: mockActiveLayer(),
    highlightWards: vi.fn(),
    clearHighlights: vi.fn(),
    pushHeatLayer: vi.fn(),
    setActiveLayer: vi.fn(),
    registerMap: vi.fn(),
  }),
}));

describe("MapLegend", () => {
  it("renders heat legend when activeLayer is heat", () => {
    mockActiveLayer.mockReturnValue("heat");
    render(<MapLegend />);
    expect(screen.getByText("HEAT SCALE")).toBeInTheDocument();
    expect(screen.getByText("MAX")).toBeInTheDocument();
  });

  it("renders risk legend when activeLayer is risk", () => {
    mockActiveLayer.mockReturnValue("risk");
    render(<MapLegend />);
    expect(screen.getByText("RISK SCALE")).toBeInTheDocument();
    expect(screen.getByText("SEVERE")).toBeInTheDocument();
  });

  it("renders nothing when activeLayer is none", () => {
    mockActiveLayer.mockReturnValue("none");
    const { container } = render(<MapLegend />);
    expect(container.firstChild).toBeNull();
  });
});
