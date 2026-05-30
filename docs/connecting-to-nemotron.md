# Connecting to the Team Nemotron Server

We run **NVIDIA Nemotron** locally on the **DGX Spark (ASUS Ascent GX10)** via **LM Studio**. It's exposed over an OpenAI-compatible API so the whole team can point the app/agent at one shared "brain" — no API keys, no cost, all local.

- **Model:** `nvidia/nemotron-3-nano-omni`
- **Port:** `1234`
- **Spark hostname:** `gx10-3939`

---

## 1. Pick your access path

| Where you are | Use this IP | Setup needed |
|---|---|---|
| Same WiFi/network as the Spark | `10.10.53.86` | None |
| Anywhere else (remote) | `100.82.97.8` | Join Tailscale (below) |

> Both IPs reach the **same** Nemotron server on the Spark. The Tailscale IP just works from any network.

### Test it first
```bash
# LAN
curl http://10.10.53.86:1234/v1/models

# or Tailscale
curl http://100.82.97.8:1234/v1/models
```
You should get back JSON listing `nvidia/nemotron-3-nano-omni`. If so, you're good.

> **PowerShell tip:** `curl` is aliased to `Invoke-WebRequest` and can be misleading. To test connectivity use:
> `Test-NetConnection 100.82.97.8 -Port 1234` → look for `TcpTestSucceeded : True`.

---

## 2. (Remote only) Join Tailscale

1. Install Tailscale: https://tailscale.com/download
2. Sign in — **you must be on the same tailnet as the Spark** (ask the Spark owner to invite/share the `gx10-3939` device).
3. Confirm you can see it:
   ```bash
   tailscale status
   ```
   You should see `gx10-3939` / `100.82.97.8`.
4. Test the endpoint (see step 1).

---

## 3. Add to your `.env`

In the repo root, create/edit `.env` (never commit it) and add:

```bash
LLM_PROVIDER=nim
NIM_BASE_URL=http://100.82.97.8:1234/v1   # or http://10.10.53.86:1234/v1 on LAN
NIM_API_KEY=lm-studio
NIM_MODEL=nvidia/nemotron-3-nano-omni
```

> `NIM_API_KEY` is ignored by LM Studio but must be non-empty. `NIM_BASE_URL` is named "NIM" for historical reasons — it just means "the OpenAI-compatible endpoint," which LM Studio provides.

### Optional fallback (if the Spark is unreachable)
Fill these only if you have an OpenAI-compatible key, then flip `LLM_PROVIDER=fallback` to switch:

```bash
FALLBACK_BASE_URL=https://api.openai.com/v1
FALLBACK_API_KEY=sk-...
FALLBACK_MODEL=gpt-4o-mini
```

---

## 4. Verify the agent can reach it

```bash
node agent/scripts/smoke-llm.mjs
node agent/scripts/smoke-agent.mjs "Which wards see most potholes next week?"
```

Then run the app and ask a golden-path question in chat:
```bash
npm run dev
```

---

## What this is for

- **Run the real app:** `npm run dev` gives everyone real Nemotron answers + tool calls instead of mocks.
- **Agent/tool dev:** test Mastra tools (`getForecast`, `getHotspots`, …) against a real LLM.
- **No keys, no cost:** local on the Spark — no OpenAI billing or rate limits.
- **Consistent demo:** everyone tests against the same model, killing "works on my machine" drift.
- **Privacy:** all 311 data + prompts stay on the Spark, never leave to a cloud API.

## Heads-up / gotchas

- **One model at a time.** LM Studio serves a single loaded model; simultaneous requests queue up. Fine for dev — just don't all stress-test at once.
- **The Spark must stay on with the server running.** If it reboots or `lms server` stops, inference goes down for everyone.
- **If it's down,** flip `LLM_PROVIDER=fallback` (with an OpenAI key) to keep working.

---

## For the Spark owner: (re)starting the server

If inference goes down, SSH into the Spark and run:

```bash
lms server start --bind 0.0.0.0 --port 1234   # --bind 0.0.0.0 = allow network access
lms server status                              # confirm it's running
lms ps                                         # confirm the model is loaded
```

Run it inside `tmux` or `screen` so closing the SSH session doesn't kill the server.
