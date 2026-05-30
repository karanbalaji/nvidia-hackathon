import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "../empty-state";

describe("EmptyState", () => {
  it("renders the title and subtitle", () => {
    render(<EmptyState title="No Data Found" subtitle="Please check filters" />);
    expect(screen.getByText("No Data Found")).toBeInTheDocument();
    expect(screen.getByText("Please check filters")).toBeInTheDocument();
  });

  it("renders action content when provided", () => {
    render(
      <EmptyState
        title="Empty"
        action={<button data-testid="retry-btn">Retry</button>}
      />
    );
    expect(screen.getByTestId("retry-btn")).toBeInTheDocument();
  });
});
