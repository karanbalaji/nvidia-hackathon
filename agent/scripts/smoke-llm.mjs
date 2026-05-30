/**
 * smoke-llm.mjs — one tiny completion round-trip against the configured LLM.
 * Usage:
 *   node agent/scripts/smoke-llm.mjs
 *   LLM_PROVIDER=fallback node agent/scripts/smoke-llm.mjs
 */
import OpenAI from "openai";

const useNim = (process.env.LLM_PROVIDER ?? "nim") !== "fallback";
const provider = useNim ? "nim" : "fallback";

const client = new OpenAI({
  baseURL: useNim
    ? (process.env.NIM_BASE_URL ?? "http://localhost:8000/v1")
    : (process.env.FALLBACK_BASE_URL ?? "https://api.openai.com/v1"),
  apiKey:
    (useNim ? process.env.NIM_API_KEY : process.env.FALLBACK_API_KEY) ??
    "not-needed",
});

const model = useNim
  ? (process.env.NIM_MODEL ?? "nvidia/nemotron-70b-instruct")
  : (process.env.FALLBACK_MODEL ?? "gpt-4o-mini");

console.log(`▶ LLM smoke test | provider=${provider} model=${model}`);

try {
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: 'Reply with exactly: PONG' }],
    max_tokens: 10,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  console.log("  response:", text);
  console.log(text.toUpperCase().includes("PONG") ? "✓ LLM smoke test passed" : "⚠ response received but no PONG");
} catch (err) {
  console.error("✗ LLM smoke test FAILED:", err.message ?? err);
  process.exit(1);
}
