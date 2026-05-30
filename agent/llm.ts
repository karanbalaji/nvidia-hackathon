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
  id: `${string}/${string}`;
  url?: string;
  apiKey?: string;
};

export function getMastraModelConfig(): OpenAICompatibleConfig {
  const useNim = (process.env.LLM_PROVIDER ?? "nim") !== "fallback";
  if (useNim) {
    const model = process.env.NIM_MODEL ?? "nvidia/nemotron-70b-instruct";
    const id = (model.includes("/") ? model : `nim/${model}`) as `${string}/${string}`;
    return {
      id,
      url: process.env.NIM_BASE_URL ?? "http://localhost:8000/v1",
      apiKey: process.env.NIM_API_KEY ?? "not-needed",
    };
  }
  const model = process.env.FALLBACK_MODEL ?? "gpt-4o-mini";
  const id = (model.includes("/") ? model : `openai/${model}`) as `${string}/${string}`;
  return {
    id,
    url: process.env.FALLBACK_BASE_URL ?? undefined,
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
