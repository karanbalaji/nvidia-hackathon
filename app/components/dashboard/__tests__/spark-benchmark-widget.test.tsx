import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SparkBenchmarkWidget } from "../spark-benchmark-widget";
import { useQuery } from "convex/react";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/../convex/_generated/api", () => ({
  api: {
    queries: {
      getPipelineRun: "getPipelineRun",
    },
  },
}));

describe("SparkBenchmarkWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when loading", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    render(<SparkBenchmarkWidget />);
    // Grid skeleton
    expect(screen.getByTestId("benchmark-skeleton")).toBeInTheDocument();
  });

  it("renders benchmark details with rapids engine", () => {
    vi.mocked(useQuery).mockReturnValue({
      runId: "run-123",
      engine: "rapids",
      rowsProcessed: 1250000,
      durationSec: 12.34,
      createdAt: "2026-05-30T10:00:00Z",
    });

    render(<SparkBenchmarkWidget />);

    expect(screen.getByText("PIPELINE EXECUTION BENCHMARKS")).toBeInTheDocument();
    expect(screen.getByText("⚡ GPU Accelerated")).toBeInTheDocument();
    expect(screen.getByText("1,250,000")).toBeInTheDocument(); // Rows formatted
    expect(screen.getByText("12.34s")).toBeInTheDocument(); // Duration formatted
  });
});
