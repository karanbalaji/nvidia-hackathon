import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RiskPanel } from "./risk-panel";
import type { RiskScore } from "@311pulse/contracts";

const makeRisk = (wardId: string, score: number): RiskScore => ({
  wardId,
  category: "flooding",
  score,
  drivers: ["heavy rain forecast", "rising trend"],
  asOf: "2026-05-30",
});

describe("RiskPanel", () => {
  it("renders cards sorted by score descending", () => {
    const data = [
      makeRisk("ward-01", 40),
      makeRisk("ward-02", 90),
      makeRisk("ward-03", 20),
    ];
    render(<RiskPanel data={data} />);
    const scores = screen
      .getAllByText(/ward-/)
      .map((el) => el.textContent ?? "");
    // ward-02 (90) should appear before ward-01 (40)
    expect(scores.indexOf("ward-02")).toBeLessThan(scores.indexOf("ward-01"));
  });

  it("shows collapse button when more than 4 items", () => {
    const data = Array.from({ length: 6 }, (_, i) =>
      makeRisk(`ward-0${i + 1}`, 90 - i * 10)
    );
    render(<RiskPanel data={data} />);
    expect(screen.getByText(/\+ 2 more/i)).toBeInTheDocument();
  });

  it("expands to show all items when Show More is clicked", async () => {
    const user = userEvent.setup();
    const data = Array.from({ length: 6 }, (_, i) =>
      makeRisk(`ward-0${i + 1}`, 90 - i * 10)
    );
    render(<RiskPanel data={data} />);
    await user.click(screen.getByText(/\+ 2 more/i));
    expect(screen.queryByText(/\+ 2 more/i)).not.toBeInTheDocument();
  });

  it("renders EmptyState when data is empty", () => {
    render(<RiskPanel data={[]} />);
    expect(screen.getByText(/no risk data/i)).toBeInTheDocument();
  });
});
