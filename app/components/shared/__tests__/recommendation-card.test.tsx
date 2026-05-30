import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecommendationCard } from "../recommendation-card";

describe("RecommendationCard", () => {
  it("renders the recommendation text and title", () => {
    render(<RecommendationCard text="Deploy resources to Ward 5 immediately." />);
    // Component renders "Recommendation" (title case)
    expect(screen.getByText("Recommendation")).toBeInTheDocument();
    expect(screen.getByText("Deploy resources to Ward 5 immediately.")).toBeInTheDocument();
  });

  it("renders driver pills when provided", () => {
    render(
      <RecommendationCard
        text="Deploy resources to Ward 5 immediately."
        drivers={["pothole", "garbage"]}
      />
    );
    // Drivers are rendered as-is (lowercase)
    expect(screen.getByText("pothole")).toBeInTheDocument();
    expect(screen.getByText("garbage")).toBeInTheDocument();
  });
});
