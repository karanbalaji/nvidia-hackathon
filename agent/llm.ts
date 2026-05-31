import OpenAI from "openai";

export function getLLM(): OpenAI {
  const useNim = (process.env.LLM_PROVIDER ?? "nim") !== "fallback";
  return new OpenAI({
    baseURL: useNim
      ? (process.env.NIM_BASE_URL ?? "http://localhost:8000/v1")
      : (process.env.FALLBACK_BASE_URL ?? "https://api.openai.com/v1"),
    apiKey:
      (useNim ? process.env.NIM_API_KEY : process.env.FALLBACK_API_KEY) ?? "not-needed",
  });
}

export const MODEL =
  (process.env.LLM_PROVIDER ?? "nim") !== "fallback"
    ? (process.env.NIM_MODEL ?? "nvidia/nemotron-70b-instruct")
    : (process.env.FALLBACK_MODEL ?? "gpt-4o-mini");

type OpenAICompatibleConfig = {
  providerId: string;
  modelId: string;
  url?: string;
  apiKey?: string;
};

export function getMastraModelConfig(): OpenAICompatibleConfig {
  const useNim = (process.env.LLM_PROVIDER ?? "nim") !== "fallback";
  if (useNim) {
    // Use providerId="openai-compatible" so Mastra keeps the full modelId
    // (e.g. "nvidia/llama-3.1-nemotron-nano-8b-v1") when calling the API.
    // If we used id="nvidia/model", Mastra would strip the "nvidia/" prefix.
    const model = process.env.NIM_MODEL ?? "nvidia/llama-3.1-nemotron-nano-8b-v1";
    return {
      providerId: "openai-compatible",
      modelId: model,
      url: process.env.NIM_BASE_URL ?? "http://localhost:8000/v1",
      apiKey: process.env.NIM_API_KEY ?? "not-needed",
    };
  }
  const model = process.env.FALLBACK_MODEL ?? "meta/llama-3.1-70b-instruct";
  return {
    providerId: "openai-compatible",
    modelId: model,
    url: process.env.FALLBACK_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.FALLBACK_API_KEY ?? "not-needed",
  };
}

/** Ping the LLM provider. Returns false (never throws) on failure. */
export async function healthcheck(): Promise<boolean> {
  try {
    const client = getLLM();
    await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
    });
    return true;
  } catch (err) {
    console.warn("[llm] healthcheck failed:", (err as Error).message);
    return false;
  }
}
