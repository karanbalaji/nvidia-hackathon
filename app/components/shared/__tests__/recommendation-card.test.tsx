import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecommendationCard } from "../recommendation-card";

describe("RecommendationCard", () => {
  it("renders the recommendation text and uppercase title", () => {
    render(<RecommendationCard text="Deploy resources to Ward 5 immediately." />);
    expect(screen.getByText("RECOMMENDATION")).toBeInTheDocument();
    expect(screen.getByText("Deploy resources to Ward 5 immediately.")).toBeInTheDocument();
  });

  it("renders driver pills when provided", () => {
    render(
      <RecommendationCard
        text="Deploy resources to Ward 5 immediately."
        drivers={["pothole", "garbage"]}
      />
    );
    expect(screen.getByText("Pothole")).toBeInTheDocument();
    expect(screen.getByText("Garbage")).toBeInTheDocument();
  });
});
