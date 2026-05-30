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
    expect(screen.getByText("WARD-03")).toBeInTheDocument();
    expect(screen.getByText("WARD-01")).toBeInTheDocument();
  });

  it('shows "+ N more" button and limits list to 4 items by default', () => {
    render(<RiskPanel data={mockRiskScores} />);
    expect(screen.getByText(/Show 1 More/i)).toBeInTheDocument();
  });

  it("expands the list when Show More is clicked", () => {
    render(<RiskPanel data={mockRiskScores} />);
    const button = screen.getByText(/Show 1 More/i);
    fireEvent.click(button);
    expect(screen.getByText(/Show Less/i)).toBeInTheDocument();
  });
});
