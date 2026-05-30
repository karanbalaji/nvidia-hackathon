import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const pingTool = createTool({
  id: "ping",
  description: "Health-check tool. Returns pong. Used to verify agent tool wiring.",
  inputSchema: z.object({ message: z.string().optional() }),
  outputSchema: z.object({ pong: z.string(), ts: z.string() }),
  execute: async (input) => ({
    pong: input.message ?? "pong",
    ts: new Date().toISOString(),
  }),
});
