import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChartSkeleton } from "../chart-skeleton";

describe("ChartSkeleton", () => {
  it("renders correctly with pulse animation classes", () => {
    const { container } = render(<ChartSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
