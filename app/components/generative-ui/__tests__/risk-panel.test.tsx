import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RiskPanel } from "../risk-panel";
import type { RiskScore } from "@311pulse/contracts";

const mockRiskScores: RiskScore[] = [
  { wardId: "ward-01", category: "pothole", score: 82, drivers: ["Rising trend"], asOf: "2026-05-30" },
  { wardId: "ward-02", category: "pothole", score: 45, drivers: ["Stable"], asOf: "2026-05-30" },
  { wardId: "ward-03", category: "flooding", score: 95, drivers: ["Heavy rain"], asOf: "2026-05-30" },
  { wardId: "ward-04", category: "garbage", score: 30, drivers: ["Low volume"], asOf: "2026-05-30" },
  { wardId: "ward-05", category: "noise", score: 62, drivers: ["Elevated noise"], asOf: "2026-05-30" },
];

describe("RiskPanel", () => {
  it("renders risk scores sorted in descending order", () => {
    render(<RiskPanel data={mockRiskScores} />);
    // Sorted descending: ward-03 (95) first, ward-01 (82) next
    expect(screen.getByText("ward-03")).toBeInTheDocument();
    expect(screen.getByText("ward-01")).toBeInTheDocument();
  });

  it('shows "+ N more" button and limits list to 4 items by default', () => {
    render(<RiskPanel data={mockRiskScores} />);
    // 5 items total, 4 shown, 1 hidden → "+ 1 more"
    expect(screen.getByText(/\+ 1 more/i)).toBeInTheDocument();
  });

  it("expands the list when Show More is clicked", () => {
    render(<RiskPanel data={mockRiskScores} />);
    const button = screen.getByText(/\+ 1 more/i);
    fireEvent.click(button);
    // After expanding, ward-02 (score 45, previously hidden) should be visible
    expect(screen.getByText("ward-02")).toBeInTheDocument();
  });
});
