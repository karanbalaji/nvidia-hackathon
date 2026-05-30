import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getLLM, isNim, setupMastraEnv } from "../llm.js";

describe("llm helpers", () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = {
      LLM_PROVIDER: process.env.LLM_PROVIDER,
      NIM_BASE_URL: process.env.NIM_BASE_URL,
      NIM_API_KEY: process.env.NIM_API_KEY,
      NIM_MODEL: process.env.NIM_MODEL,
      FALLBACK_BASE_URL: process.env.FALLBACK_BASE_URL,
      FALLBACK_API_KEY: process.env.FALLBACK_API_KEY,
      FALLBACK_MODEL: process.env.FALLBACK_MODEL,
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    };
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(originalEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  describe("isNim()", () => {
    it("returns true when LLM_PROVIDER=nim", () => {
      process.env.LLM_PROVIDER = "nim";
      expect(isNim()).toBe(true);
    });

    it("returns true when LLM_PROVIDER is unset (default)", () => {
      delete process.env.LLM_PROVIDER;
      expect(isNim()).toBe(true);
    });

    it("returns false when LLM_PROVIDER=fallback", () => {
      process.env.LLM_PROVIDER = "fallback";
      expect(isNim()).toBe(false);
    });
  });

  describe("getLLM()", () => {
    it("uses NIM base URL when LLM_PROVIDER=nim", () => {
      process.env.LLM_PROVIDER = "nim";
      process.env.NIM_BASE_URL = "http://nim-test:8000/v1";
      process.env.NIM_API_KEY = "nim-key";
      const client = getLLM();
      expect((client as unknown as { baseURL: string }).baseURL).toContain("nim-test");
    });

    it("uses fallback base URL when LLM_PROVIDER=fallback", () => {
      process.env.LLM_PROVIDER = "fallback";
      process.env.FALLBACK_BASE_URL = "https://openai-fallback.test/v1";
      process.env.FALLBACK_API_KEY = "fb-key";
      const client = getLLM();
      expect((client as unknown as { baseURL: string }).baseURL).toContain("openai-fallback");
    });

    it("falls back to default NIM URL when NIM_BASE_URL is unset", () => {
      process.env.LLM_PROVIDER = "nim";
      delete process.env.NIM_BASE_URL;
      const client = getLLM();
      expect((client as unknown as { baseURL: string }).baseURL).toContain("localhost:8000");
    });
  });

  describe("setupMastraEnv()", () => {
    it("sets OPENAI vars from NIM vars when nim provider", () => {
      process.env.LLM_PROVIDER = "nim";
      process.env.NIM_API_KEY = "nim-secret";
      process.env.NIM_BASE_URL = "http://nim:8000/v1";
      setupMastraEnv();
      expect(process.env.OPENAI_API_KEY).toBe("nim-secret");
      expect(process.env.OPENAI_BASE_URL).toBe("http://nim:8000/v1");
    });

    it("sets OPENAI vars from fallback vars when fallback provider", () => {
      process.env.LLM_PROVIDER = "fallback";
      process.env.FALLBACK_API_KEY = "fb-secret";
      process.env.FALLBACK_BASE_URL = "https://api.openai.com/v1";
      setupMastraEnv();
      expect(process.env.OPENAI_API_KEY).toBe("fb-secret");
      expect(process.env.OPENAI_BASE_URL).toBe("https://api.openai.com/v1");
    });
  });
});
