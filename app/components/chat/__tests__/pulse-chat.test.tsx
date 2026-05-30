import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PulseChat } from "../pulse-chat";
import { SidebarProvider } from "@/context/sidebar-context";
import { WardProvider } from "@/context/ward-context";

vi.mock("@copilotkit/react-ui", () => ({
  CopilotChat: () => <div data-testid="mock-copilot-chat" />,
}));

vi.mock("@copilotkit/react-core", () => ({
  useCopilotReadable: vi.fn(),
  useCopilotAction: vi.fn(),
  useCopilotChat: () => ({ appendMessage: vi.fn() }),
}));

vi.mock("@copilotkit/runtime-client-gql", () => ({
  TextMessage: class { constructor(p: Record<string, unknown>) { Object.assign(this, p); } },
  Role: { User: "user" },
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/copilot/copilot-actions", () => ({
  CopilotActions: () => null,
}));

describe("PulseChat", () => {
  it("renders headers and copilot chat component when expanded", () => {
    render(
      <WardProvider>
        <SidebarProvider>
          <PulseChat />
        </SidebarProvider>
      </WardProvider>
    );

    expect(screen.getByText("311 Pulse Agent")).toBeInTheDocument();
    expect(screen.getByTestId("mock-copilot-chat")).toBeInTheDocument();
    expect(screen.getByText(/pothole complaints next week/i)).toBeInTheDocument();
  });
});
