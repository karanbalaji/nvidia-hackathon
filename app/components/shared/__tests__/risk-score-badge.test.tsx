import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RiskScoreBadge } from "../risk-score-badge";

describe("RiskScoreBadge", () => {
  it("renders the score number", () => {
    render(<RiskScoreBadge score={75} />);
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("renders the correct severity label when showLabel is true", () => {
    render(<RiskScoreBadge score={75} showLabel={true} />);
    // Score 75 → 61-80 band → "High" (from severity.ts)
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("does not render the label when showLabel is false", () => {
    render(<RiskScoreBadge score={75} showLabel={false} />);
    expect(screen.queryByText("High")).not.toBeInTheDocument();
  });
});
