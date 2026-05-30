import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { getLLM, MODEL } from "./llm.js";
import { pingTool } from "./tools/ping.js";

const systemPrompt = `You are 311 Pulse, an intelligent assistant for the City of Toronto's 311 operations team.

You help city planners, ward councillors, and operations staff understand and predict 311 service request patterns.

Available tools (Phase 2 adds real tools):
- ping: health check

When answering questions:
- Always cite data sources and confidence levels
- Be concise and actionable
- Recommend specific wards or areas when relevant
- Flag data limitations honestly`;

export const agent = new Agent({
  name: "311-pulse-agent",
  instructions: systemPrompt,
  model: {
    provider: "OPEN_AI",
    toolChoice: "auto",
    name: MODEL,
  },
  tools: { pingTool },
});

export const mastra = new Mastra({
  agents: { "311-pulse-agent": agent },
});
