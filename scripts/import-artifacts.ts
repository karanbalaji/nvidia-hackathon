/**
 * Reads pipeline/artifacts/, validates against @311pulse/contracts Zod schemas,
 * then calls Convex importArtifacts mutation to upsert all data.
 *
 * Usage: node --experimental-vm-modules scripts/import-artifacts.ts
 *        (wired to `npm run import` via tsx in root package.json)
 */

import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import {
  WardArraySchema,
  ForecastArraySchema,
  HotspotArraySchema,
  RiskScoreArraySchema,
  PipelineRunSchema,
} from "../packages/contracts/src/index.js";

const ARTIFACTS = path.join(process.cwd(), "pipeline/artifacts");
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "";

if (!CONVEX_URL) {
  console.error("CONVEX_URL / NEXT_PUBLIC_CONVEX_URL not set in env. Add it to .env");
  process.exit(1);
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(ARTIFACTS, file), "utf8")) as T;
}

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log("Reading artifacts from", ARTIFACTS);

  const rawWards = readJson("wards.json");
  const wards = WardArraySchema.parse(rawWards);
  console.log(`  wards: ${wards.length} records`);

  const rawForecasts = readJson("forecasts.json");
  const forecasts = ForecastArraySchema.parse(rawForecasts);
  console.log(`  forecasts: ${forecasts.length} records`);

  const rawHotspots = readJson("hotspots.json");
  const hotspots = HotspotArraySchema.parse(rawHotspots);
  console.log(`  hotspots: ${hotspots.length} records`);

  const rawRisk = readJson("risk_scores.json");
  const riskScores = RiskScoreArraySchema.parse(rawRisk);
  console.log(`  risk_scores: ${riskScores.length} records`);

  const rawSummaries = readJson<{ category: string; wardId: string; period: string; summary: string }[]>("request_summaries.json");
  console.log(`  summaries: ${rawSummaries.length} records`);

  const rawRun = readJson("pipeline_run.json");
  const pipelineRun = PipelineRunSchema.parse(rawRun);
  console.log(`  pipeline_run: ${pipelineRun.runId}`);

  console.log("\nImporting into Convex...");

  // Note: daily_aggregates are large — imported separately in Phase 2 in batches.
  // For Phase 0, we import everything except the big parquet file.
  await (client as any).mutation("mutations:importArtifacts", {
    wards,
    forecasts,
    hotspots,
    riskScores,
    summaries: rawSummaries,
    pipelineRun,
  });

  console.log("✓ Import complete");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
