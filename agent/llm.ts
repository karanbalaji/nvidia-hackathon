import OpenAI from "openai";

export function isNim(): boolean {
  return (process.env.LLM_PROVIDER ?? "nim") !== "fallback";
}

export function getLLM(): OpenAI {
  const nim = isNim();
  return new OpenAI({
    baseURL: nim
      ? (process.env.NIM_BASE_URL ?? "http://localhost:8000/v1")
      : (process.env.FALLBACK_BASE_URL ?? "https://api.openai.com/v1"),
    apiKey:
      (nim ? process.env.NIM_API_KEY : process.env.FALLBACK_API_KEY) ??
      "not-needed",
  });
}

export const MODEL = isNim()
  ? (process.env.NIM_MODEL ?? "nvidia/nemotron-70b-instruct")
  : (process.env.FALLBACK_MODEL ?? "gpt-4o-mini");

// Bridge NIM_* env vars into OPENAI_* so Mastra's built-in OPEN_AI provider
// picks up the correct endpoint automatically.
export function setupMastraEnv(): void {
  const nim = isNim();
  process.env.OPENAI_API_KEY =
    (nim ? process.env.NIM_API_KEY : process.env.FALLBACK_API_KEY) ??
    "not-needed";
  process.env.OPENAI_BASE_URL = nim
    ? (process.env.NIM_BASE_URL ?? "http://localhost:8000/v1")
    : (process.env.FALLBACK_BASE_URL ?? "https://api.openai.com/v1");
}

/** Pings the configured LLM with a 1-token request. Returns true on success. */
export async function healthcheck(): Promise<{
  ok: boolean;
  provider: string;
  error?: string;
}> {
  const provider = isNim() ? "nim" : "fallback";
  try {
    const client = getLLM();
    await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
    });
    return { ok: true, provider };
  } catch (e) {
    return { ok: false, provider, error: String(e) };
  }
}
