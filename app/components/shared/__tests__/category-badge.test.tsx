import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryBadge } from "../category-badge";

describe("CategoryBadge", () => {
  it("renders the correct label for a category", () => {
    render(<CategoryBadge category="pothole" />);
    expect(screen.getByText("Pothole")).toBeInTheDocument();
  });

  it("renders fallback label for unknown category", () => {
    render(<CategoryBadge category="unknown" />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});
