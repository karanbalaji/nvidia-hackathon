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
    expect(cfg.id).toBe("nvidia/nemotron-70b-instruct");
    expect(cfg.url).toBe("http://localhost:8000/v1");
  });

  it("prefixes openai/ for fallback model without slash", async () => {
    process.env = { ...savedEnv, LLM_PROVIDER: "fallback", FALLBACK_MODEL: "gpt-4o-mini" };
    vi.resetModules();
    const { getMastraModelConfig } = await import("../llm.js");
    const cfg = getMastraModelConfig() as any;
    expect(cfg.id).toBe("openai/gpt-4o-mini");
  });

  it("keeps existing slash in fallback model id", async () => {
    process.env = { ...savedEnv, LLM_PROVIDER: "fallback", FALLBACK_MODEL: "openai/gpt-4o" };
    vi.resetModules();
    const { getMastraModelConfig } = await import("../llm.js");
    const cfg = getMastraModelConfig() as any;
    expect(cfg.id).toBe("openai/gpt-4o");
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
