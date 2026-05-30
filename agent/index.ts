import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { isNim, MODEL } from "./llm.js";
import { pingTool } from "./tools/ping.js";
import { getForecastTool } from "./tools/getForecast.js";
import { queryRequestsTool } from "./tools/queryRequests.js";
import { getHotspotsTool } from "./tools/getHotspots.js";
import { getRiskScoreTool } from "./tools/getRiskScore.js";
import { simulateWeatherTool } from "./tools/simulateWeather.js";

const nim = isNim();

// Build OpenAICompatibleConfig pointing at NIM or the fallback endpoint.
// Mastra v1.37 accepts { id: "<provider>/<model>", url?, apiKey? } directly.
const modelConfig = {
  id: `${nim ? "nim" : "fallback"}/${MODEL}` as `${string}/${string}`,
  url: nim
    ? (process.env.NIM_BASE_URL ?? "http://localhost:8000/v1")
    : process.env.FALLBACK_BASE_URL,
  apiKey:
    (nim ? process.env.NIM_API_KEY : process.env.FALLBACK_API_KEY) ??
    "not-needed",
};

const systemPrompt = `You are 311 Pulse, an AI operations assistant for the City of Toronto's 311 service.
You help city planners, ward councillors, and operations staff understand and predict 311 service request patterns.

## Tools — when to use each

- **getForecast**: Use when asked "which wards will see most X next week?" or any future-looking count question.
- **queryRequests**: Use for historical trend analysis, period comparisons, or weather correlations ("show garbage complaints in Scarborough correlated with rain last year").
- **getHotspots**: Use for spatial questions — high-density areas, where to pre-position crews, or map-layer requests.
- **getRiskScore**: Use when asked about high-risk wards, alert priorities, or weather-driven risk levels.
- **simulateWeather**: Use for "what if heavy rain?" or before/after weather scenario comparisons.
- **ping**: Health check only.

## Response guidelines

- Always cite the data (ward IDs, counts, dates, drivers) behind your recommendations.
- Be concise and actionable — recommend specific wards or time windows.
- When recommending crew pre-positioning, cite the hotspot centroid or the highest-risk ward.
- Flag data limitations honestly (e.g., "based on mock data" until Phase 1 runs).
- Never invent numbers — only report what the tools return.`;

export const agent = new Agent({
  id: "311-pulse-agent",
  name: "311 Pulse Agent",
  instructions: systemPrompt,
  model: modelConfig,
  tools: {
    pingTool,
    getForecastTool,
    queryRequestsTool,
    getHotspotsTool,
    getRiskScoreTool,
    simulateWeatherTool,
  },
});

export const mastra = new Mastra({
  agents: { "311-pulse-agent": agent },
});
