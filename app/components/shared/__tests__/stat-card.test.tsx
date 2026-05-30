import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatCard } from "../stat-card";

describe("StatCard", () => {
  it("renders the title and value", () => {
    render(<StatCard title="Total Requests" value="1,234" />);
    expect(screen.getByText("Total Requests")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("renders delta info when provided", () => {
    render(<StatCard title="Total Requests" value="1,234" delta="+12%" deltaPositive={true} />);
    expect(screen.getByText("+12%")).toBeInTheDocument();
  });

  it("renders loading skeleton when loading is true", () => {
    const { container } = render(<StatCard title="Total Requests" value="1,234" loading={true} />);
    // Check that we render some pulse/skeleton element
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
