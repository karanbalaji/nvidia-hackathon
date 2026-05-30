import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MapSkeleton } from "../map-skeleton";

describe("MapSkeleton", () => {
  it("renders loading text", () => {
    render(<MapSkeleton />);
    expect(screen.getByText("Loading map...")).toBeInTheDocument();
  });
});
