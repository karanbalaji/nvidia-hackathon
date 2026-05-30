import OpenAI from "openai";

export function getLLM(): OpenAI {
  const useNim = (process.env.LLM_PROVIDER ?? "nim") !== "fallback";
  return new OpenAI({
    baseURL: useNim
      ? (process.env.NIM_BASE_URL ?? "http://localhost:8000/v1")
      : (process.env.FALLBACK_BASE_URL ?? "https://api.openai.com/v1"),
    apiKey:
      (useNim ? process.env.NIM_API_KEY : process.env.FALLBACK_API_KEY) ??
      "not-needed",
  });
}

export const MODEL =
  (process.env.LLM_PROVIDER ?? "nim") !== "fallback"
    ? (process.env.NIM_MODEL ?? "nvidia/nemotron-70b-instruct")
    : (process.env.FALLBACK_MODEL ?? "gpt-4o-mini");
