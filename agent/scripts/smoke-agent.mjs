/**
 * smoke-agent.mjs — end-to-end agent smoke test.
 * Verifies: LLM picks up a question, calls the getForecast tool, and synthesises an answer.
 *
 * Usage:
 *   node agent/scripts/smoke-agent.mjs "Which wards see most potholes next week?"
 *
 * Requires NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL) to fetch live data.
 * Falls back to inline mock data if Convex is unreachable.
 */
import OpenAI from "openai";
import { ConvexHttpClient } from "convex/browser";

const useNim = (process.env.LLM_PROVIDER ?? "nim") !== "fallback";
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "";

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

const question =
  process.argv[2] ?? "Which wards see most potholes next week?";

console.log(`▶ Agent smoke test | provider=${useNim ? "nim" : "fallback"} model=${model}`);
console.log(`  question: "${question}"`);

// Fetch live forecast data or use inline mock
let forecastData = [];
if (convexUrl) {
  try {
    const convex = new ConvexHttpClient(convexUrl);
    forecastData = await convex.query("queries:getForecast", { category: "pothole" });
    console.log(`  fetched ${forecastData.length} forecast rows from Convex`);
  } catch (e) {
    console.log("  ⚠ Convex unreachable, using inline mock data");
  }
}

if (forecastData.length === 0) {
  forecastData = [
    { wardId: "ward-01", category: "pothole", predictedCount: 42, horizonStart: "2026-06-01", horizonEnd: "2026-06-07", confidenceLow: 35, confidenceHigh: 50, method: "movingavg" },
    { wardId: "ward-02", category: "pothole", predictedCount: 38, horizonStart: "2026-06-01", horizonEnd: "2026-06-07", confidenceLow: 30, confidenceHigh: 46, method: "movingavg" },
    { wardId: "ward-03", category: "pothole", predictedCount: 19, horizonStart: "2026-06-01", horizonEnd: "2026-06-07", confidenceLow: 14, confidenceHigh: 25, method: "movingavg" },
  ];
}

// Tool definitions visible to the LLM
const tools = [
  {
    type: "function",
    function: {
      name: "getForecast",
      description: "Predicted 311 request counts per ward for the next 7 days.",
      parameters: {
        type: "object",
        properties: {
          wardId: { type: "string", description: "Optional ward ID filter" },
          category: { type: "string", description: "Optional category filter" },
        },
      },
    },
  },
];

const systemPrompt =
  "You are 311 Pulse, Toronto 311 operations AI. Use getForecast to answer ward-level forecast questions. Always cite specific ward IDs and counts.";

// Step 1: ask the LLM
const step1 = await client.chat.completions.create({
  model,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ],
  tools,
  tool_choice: "auto",
  max_tokens: 300,
});

const choice = step1.choices[0];
console.log(`  step1 finish_reason: ${choice.finish_reason}`);

if (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.length) {
  const toolCall = choice.message.tool_calls[0];
  console.log(`  tool called: ${toolCall.function.name}(${toolCall.function.arguments})`);

  // Step 2: return tool result and get final answer
  const step2 = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
      choice.message,
      {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(forecastData),
      },
    ],
    max_tokens: 500,
  });

  const answer = step2.choices[0]?.message?.content ?? "(no content)";
  console.log("\n  answer:\n" + answer.split("\n").map(l => "    " + l).join("\n"));
  console.log("\n✓ Agent smoke test passed — tool call triggered and answer synthesised");
} else {
  const directAnswer = choice.message.content ?? "(no content)";
  console.log("  LLM answered without tool call:", directAnswer);
  console.log("⚠ Agent smoke test: answer given but no tool call detected");
}
