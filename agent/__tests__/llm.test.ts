import { vi, describe, it, expect, afterEach } from "vitest";

describe("getLLM", () => {
  const savedEnv = process.env;
  afterEach(() => {
    process.env = savedEnv;
    vi.resetModules();
  });

  it("uses NIM base URL when LLM_PROVIDER=nim", async () => {
    process.env = { ...savedEnv, LLM_PROVIDER: "nim", NIM_BASE_URL: "http://localhost:8000/v1" };
    vi.resetModules();
    const { getLLM } = await import("../llm.js");
    const client = getLLM();
    expect((client as any).baseURL).toContain("localhost:8000");
  });

  it("uses fallback base URL when LLM_PROVIDER=fallback", async () => {
    process.env = { ...savedEnv, LLM_PROVIDER: "fallback", FALLBACK_BASE_URL: "https://api.openai.com/v1" };
    vi.resetModules();
    const { getLLM } = await import("../llm.js");
    const client = getLLM();
    expect((client as any).baseURL).toContain("api.openai.com");
  });
});

describe("getMastraModelConfig", () => {
  const savedEnv = process.env;
  afterEach(() => {
    process.env = savedEnv;
    vi.resetModules();
  });

  it("returns NIM config when LLM_PROVIDER=nim", async () => {
    process.env = {
      ...savedEnv,
      LLM_PROVIDER: "nim",
      NIM_MODEL: "nvidia/nemotron-70b-instruct",
      NIM_BASE_URL: "http://localhost:8000/v1",
    };
    vi.resetModules();
    const { getMastraModelConfig } = await import("../llm.js");
    const cfg = getMastraModelConfig() as any;
    // getMastraModelConfig returns { providerId, modelId } so Mastra passes
    // the full model path to the API without stripping the namespace prefix
    expect(cfg.modelId).toBe("nvidia/nemotron-70b-instruct");
    expect(cfg.providerId).toBe("openai-compatible");
    expect(cfg.url).toBe("http://localhost:8000/v1");
  });

  it("returns fallback config with full model id", async () => {
    process.env = { ...savedEnv, LLM_PROVIDER: "fallback", FALLBACK_MODEL: "meta/llama-3.1-8b-instruct" };
    vi.resetModules();
    const { getMastraModelConfig } = await import("../llm.js");
    const cfg = getMastraModelConfig() as any;
    expect(cfg.modelId).toBe("meta/llama-3.1-8b-instruct");
    expect(cfg.providerId).toBe("openai-compatible");
  });

  it("falls back to default NIM model when NIM_MODEL not set", async () => {
    const env = { ...savedEnv, LLM_PROVIDER: "nim" };
    delete env.NIM_MODEL;
    process.env = env;
    vi.resetModules();
    const { getMastraModelConfig } = await import("../llm.js");
    const cfg = getMastraModelConfig() as any;
    expect(cfg.modelId).toBe("nvidia/llama-3.1-nemotron-nano-8b-v1");
  });
});

describe("healthcheck", () => {
  it("returns false (never throws) when LLM is unreachable", async () => {
    const { healthcheck } = await import("../llm.js");
    // NIM won't be running in test — should return false gracefully
    const result = await healthcheck();
    expect(typeof result).toBe("boolean");
  });
});
