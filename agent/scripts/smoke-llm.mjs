#!/usr/bin/env node
// One-shot LLM completion round-trip.
// Usage: node agent/scripts/smoke-llm.mjs
//        LLM_PROVIDER=fallback node agent/scripts/smoke-llm.mjs

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../app/.env.local") });

const { getLLM, MODEL } = await import("../llm.ts");

const provider = process.env.LLM_PROVIDER ?? "nim";
console.log(`[smoke-llm] provider=${provider} model=${MODEL}`);

try {
  const client = getLLM();
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: "Reply with exactly the word: PONG" }],
    max_tokens: 10,
  });
  const text = res.choices[0]?.message?.content ?? "(empty)";
  console.log(`[smoke-llm] response: ${text}`);
  console.log("[smoke-llm] ✓ PASS");
  process.exit(0);
} catch (err) {
  console.error("[smoke-llm] ✗ FAIL:", err.message);
  process.exit(1);
}
