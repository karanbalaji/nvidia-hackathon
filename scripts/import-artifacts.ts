/**
 * Reads pipeline/artifacts/, validates against @311pulse/contracts Zod schemas,
 * then calls Convex importArtifacts mutation to upsert all data.
 *
 * Usage: node --experimental-vm-modules scripts/import-artifacts.ts
 *        (wired to `npm run import` via tsx in root package.json)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
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

  // Read daily_aggregates parquet via Python (pandas already installed for pipeline)
  const parquetPath = path.join(ARTIFACTS, "daily_aggregates.parquet");
  let dailyAggregates: { date: string; wardId: string; category: string; count: number; tempC: number | null; precipMm: number | null }[] = [];
  if (fs.existsSync(parquetPath)) {
    try {
      const safePath = parquetPath.replace(/\\/g, "/");
      const jsonOut = execSync(
        `python3 -c "import pandas as pd, json, sys; df=pd.read_parquet('${safePath}'); df['tempC']=df['tempC'].where(df['tempC'].notna(), None); df['precipMm']=df['precipMm'].where(df['precipMm'].notna(), None); print(json.dumps(df.to_dict('records')))"`,
        { maxBuffer: 64 * 1024 * 1024 }
      ).toString();
      dailyAggregates = JSON.parse(jsonOut);
      console.log(`  daily_aggregates: ${dailyAggregates.length} records`);
    } catch (err) {
      console.warn("  daily_aggregates.parquet read failed — skipping trend data");
      console.warn(" ", (err as Error).message.split("\n")[0]);
    }
  } else {
    console.warn("  daily_aggregates.parquet not found — skipping");
  }

  console.log("\nImporting into Convex...");

  await (client as any).mutation("mutations:importArtifacts", {
    wards,
    forecasts,
    hotspots,
    riskScores,
    summaries: rawSummaries,
    pipelineRun,
  });

  // Batch-import daily aggregates to stay within Convex's 8MB mutation limit
  if (dailyAggregates.length > 0) {
    console.log("  clearing existing dailyAggregates...");
    await (client as any).mutation("mutations:clearDailyAggregates", {});
    const BATCH = 2000;
    const total = dailyAggregates.length;
    for (let i = 0; i < total; i += BATCH) {
      const slice = dailyAggregates.slice(i, i + BATCH);
      await (client as any).mutation("mutations:importArtifacts", { dailyAggregates: slice });
      process.stdout.write(`\r  daily_aggregates: ${Math.min(i + BATCH, total)}/${total}`);
    }
    console.log("\n  ✓ daily_aggregates imported");
  }

  console.log("✓ Import complete");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
