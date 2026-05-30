import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CopilotActions } from "../copilot-actions";
import { useCopilotAction } from "@copilotkit/react-core";

vi.mock("@copilotkit/react-core", () => ({
  useCopilotAction: vi.fn(),
}));

describe("CopilotActions", () => {
  it("registers all Copilot actions for Mastra tools", () => {
    render(<CopilotActions />);

    // Check that useCopilotAction was called for each tool
    const registeredActions = vi.mocked(useCopilotAction).mock.calls.map(
      (call) => call[0].name
    );

    expect(registeredActions).toContain("getForecast");
    expect(registeredActions).toContain("queryRequests");
    expect(registeredActions).toContain("getHotspots");
    expect(registeredActions).toContain("getRiskScore");
  });
});
