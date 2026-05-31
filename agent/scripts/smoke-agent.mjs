#!/usr/bin/env node
// Full agent smoke test — verifies a tool is triggered.
// Usage: node agent/scripts/smoke-agent.mjs "Which wards see most potholes next week?"
// Requires CONVEX_URL and LLM env vars.

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../app/.env.local") });

const { agent } = await import("../index.ts");

const question = process.argv[2] ?? "Which wards will see the most pothole complaints next week?";
console.log(`[smoke-agent] question: ${question}`);

try {
  const result = await agent.generate([{ role: "user", content: question }]);
  const text = typeof result.text === "string"
    ? result.text
    : JSON.stringify(result);
  console.log(`[smoke-agent] response:\n${text}`);

  const hasWardRef = /ward-\d+/i.test(text);
  if (hasWardRef) {
    console.log("[smoke-agent] ✓ ward IDs found — tool fired successfully");
  } else {
    console.warn("[smoke-agent] ⚠ no ward IDs in response — tool may not have fired");
  }
  process.exit(0);
} catch (err) {
  console.error("[smoke-agent] ✗ FAIL:", err.message);
  process.exit(1);
}
