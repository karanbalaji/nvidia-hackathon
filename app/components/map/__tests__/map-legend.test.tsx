import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MapLegend } from "../map-legend";

describe("MapLegend", () => {
  it("renders legend header and heat scale labels", () => {
    render(<MapLegend activeLayer="heat" />);
    expect(screen.getByText("Legend")).toBeInTheDocument();
    // Heat ramp labels: "Max" is the highest
    expect(screen.getByText("Max")).toBeInTheDocument();
  });

  it("renders risk scale labels when activeLayer is risk", () => {
    render(<MapLegend activeLayer="risk" />);
    expect(screen.getByText("Legend")).toBeInTheDocument();
    // Risk scale shows "High 67–100"
    expect(screen.getByText(/High 67/)).toBeInTheDocument();
  });

  it("renders nothing when activeLayer is none", () => {
    const { container } = render(<MapLegend activeLayer="none" />);
    expect(container.firstChild).toBeNull();
  });
});
