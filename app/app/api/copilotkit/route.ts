import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { getLocalAgents } from "@ag-ui/mastra";
import { mastra } from "@311pulse/agent";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const runtime = new CopilotRuntime({
    agents: getLocalAgents({ mastra: mastra as any, resourceId: "311-pulse-agent" }) as any,
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
