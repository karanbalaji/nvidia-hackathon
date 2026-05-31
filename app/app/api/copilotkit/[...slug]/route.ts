/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { getLocalAgents } from "@ag-ui/mastra";
import { mastra } from "@311pulse/agent";
import { NextRequest, NextResponse } from "next/server";

function createHandler() {
  const runtime = new CopilotRuntime({
    agents: getLocalAgents({ mastra: mastra as any, resourceId: "311-pulse-agent" }) as any,
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest;
}

function isThreadsPath(req: NextRequest): boolean {
  const url = new URL(req.url);
  return url.pathname.includes("/threads");
}

// ExperimentalEmptyAdapter has no thread storage — return empty responses
// so CopilotKit's thread-refresh calls don't 405/error in the browser.
export const GET = async (req: NextRequest) => {
  if (isThreadsPath(req)) {
    return NextResponse.json({ threads: [] });
  }
  return createHandler()(req);
};

export const POST = async (req: NextRequest) => createHandler()(req);
export const DELETE = async (req: NextRequest) => {
  if (isThreadsPath(req)) {
    return NextResponse.json({ ok: true });
  }
  return createHandler()(req);
};
export const PUT = async (req: NextRequest) => createHandler()(req);
export const PATCH = async (req: NextRequest) => createHandler()(req);
