import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WardHighlight } from "../ward-highlight";

const mockHighlightWards = vi.fn();
const mockClearHighlights = vi.fn();

vi.mock("@/context/map-context", () => ({
  useMap311: () => ({
    highlightWards: mockHighlightWards,
    clearHighlights: mockClearHighlights,
    pushHeatLayer: vi.fn(),
    setActiveLayer: vi.fn(),
    registerMap: vi.fn(),
  }),
}));

describe("WardHighlight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls highlightWards on mount", () => {
    render(<WardHighlight wardIds={["ward-01", "ward-02"]} />);
    expect(mockHighlightWards).toHaveBeenCalledWith(["ward-01", "ward-02"]);
  });

  it("calls clearHighlights on unmount", () => {
    const { unmount } = render(<WardHighlight wardIds={["ward-01"]} />);
    unmount();
    expect(mockClearHighlights).toHaveBeenCalled();
  });
});
