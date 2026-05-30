# Phase 4 — Polish, Reliability & Submission

> **Goal:** Make the golden path bulletproof, run the full pipeline on the **DGX Spark** to capture the real RAPIDS benchmark, write the README + NVIDIA story, and produce the 3–5 minute demo video. Ship.

**Owner agent scope:** Requires Phases 1–3 working (golden path runs end-to-end). Read this file + `prd.md` (§8, §9, §11, §12) + `docs/README.md` §3.

**Outcome:** Public repo + README + demo video + (if possible) live demo on GX10. Submission complete before **Sun May 31, 11:00 AM**.

---

## 1. Reliability hardening (protect the golden path)
- [ ] Run the three §3 user stories repeatedly; fix any fl akiness in tool calls, rendering, or map highlight timing.
- [ ] Verify LLM fallback: kill NIM, confirm chat still answers via fallback provider.
- [ ] Verify engine fallback: app works whether artifacts came from pandas/polars/RAPIDS.
- [ ] Add global error boundaries; ensure no white-screen crashes during demo.
- [ ] Seed a known-good Convex dataset so the demo is reproducible even offline.
- [ ] Pre-cache the demo questions' data so first responses are fast.

## 2. DGX Spark run (the NVIDIA payoff)
- [ ] On the Spark: install RAPIDS extras; set `PIPELINE_ENGINE=rapids`.
- [ ] Run the **full multi-year** dataset: `python -m pipeline.src.run --engine rapids`.
- [ ] Capture `pipeline_run.json` (rows, durationSec, engine).
- [ ] Run the same scale on CPU (or use the sampled-Mac number, clearly labeled) and compute the **measured speedup**.
- [ ] Run Nemotron via **local NIM** on the Spark; confirm the agent uses it.
- [ ] Re-import artifacts → confirm UI shows full-scale data + updated benchmark stat on `/dashboard`.

> If Spark access is limited, document the exact commands and present the Mac numbers honestly with the RAPIDS code path shown. Never fabricate benchmark figures.

## 3. Performance pass
- [ ] Stream tokens in chat; show tool-call progress so latency feels responsive.
- [ ] Ensure simple Convex lookups return < 2s.
- [ ] Lazy-load map/charts; trim bundle.

## 4. README.md (judging-critical)
Write a strong root `README.md` containing:
- [ ] One-line pitch + hero screenshot/GIF of the golden path.
- [ ] Problem → solution narrative (from `prd.md` §2).
- [ ] **Architecture diagram** (from `prd.md` §5) + data flow.
- [ ] **NVIDIA / DGX Spark story** with the **measured** RAPIDS speedup and local-Nemotron note (`prd.md` §5).
- [ ] Tech stack table.
- [ ] Setup instructions: env vars (§3.6), `convex dev`, `python -m pipeline.src.run`, `npm run import`, `npm run dev`.
- [ ] How to switch engines (`PIPELINE_ENGINE`) and LLM providers (`LLM_PROVIDER`).
- [ ] Screenshots: map, chat with generative chart, dashboard.
- [ ] Known limitations + future work.

## 5. Demo video (3–5 min)
- [ ] Write a script that follows the **golden path** (`prd.md` §9) beat-for-beat:
  1. 20s problem framing (reactive → proactive).
  2. Open app, show map + dashboard predictions.
  3. Ask the forecast question → chart renders in chat + map highlights wards → recommendation.
  4. Follow-up "why?" → weather correlation explanation.
  5. 30s NVIDIA story: "running on DGX Spark, RAPIDS gave us Nx speedup, Nemotron runs locally via NIM."
  6. Close on impact for city staff + residents.
- [ ] Record screen + voiceover. Keep under 5 min. Show the system actually working (not slides).
- [ ] Export and store the link/file.

## 6. Submission package (`prd.md` §12)
- [ ] Public GitHub repo, clean history, `.env` not committed, `.env.example` present.
- [ ] Final commit + tag.
- [ ] Project description (pitch + NVIDIA usage + impact).
- [ ] Demo video link.
- [ ] Live demo ready on GX10 (if possible): documented startup commands.

## 7. Final acceptance (Definition of Done)
- [ ] All three `prd.md` §3 user stories work end-to-end in the deployed/local app.
- [ ] Agent calls real tools over real (Spark-processed) data and renders generative UI.
- [ ] README complete with measured Spark/RAPIDS benchmark + Nemotron-local note.
- [ ] Demo video recorded and uploaded.
- [ ] Repo public; submission form completed **before the deadline**.

## 8. Self-Test (capture output)
```bash
# Cold start from a clean clone:
cp .env.example .env   # fill values
npx convex dev &        # deploy schema
python -m pipeline.src.run --sample 50000 && npm run import
npm run dev             # golden path runs end-to-end
# Then: watch the recorded demo video start-to-finish < 5 min
```

## 9. Time-box guardrail
If running late, ship in this order and stop when out of time:
1. Golden-path forecast question working in chat + map (the one thing).
2. README + demo video of #1.
3. Dashboard predictions view.
4. Remaining two user stories.
5. Spark full run + benchmark.
6. Nice-to-haves.

**A recorded, working golden path + README beats a half-built everything.**
