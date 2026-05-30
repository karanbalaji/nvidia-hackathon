import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const importArtifacts = mutation({
  args: {
    wards: v.optional(v.array(v.object({
      wardId: v.string(),
      wardName: v.string(),
      neighbourhoods: v.array(v.string()),
    }))),
    forecasts: v.optional(v.array(v.object({
      wardId: v.string(),
      category: v.string(),
      horizonStart: v.string(),
      horizonEnd: v.string(),
      predictedCount: v.number(),
      confidenceLow: v.number(),
      confidenceHigh: v.number(),
      method: v.string(),
    }))),
    hotspots: v.optional(v.array(v.object({
      category: v.string(),
      wardId: v.string(),
      neighbourhood: v.union(v.string(), v.null()),
      centroidLat: v.number(),
      centroidLng: v.number(),
      intensity: v.number(),
      count: v.number(),
    }))),
    riskScores: v.optional(v.array(v.object({
      wardId: v.string(),
      category: v.string(),
      score: v.number(),
      drivers: v.array(v.string()),
      asOf: v.string(),
    }))),
    summaries: v.optional(v.array(v.object({
      category: v.string(),
      wardId: v.string(),
      period: v.string(),
      summary: v.string(),
    }))),
    dailyAggregates: v.optional(v.array(v.object({
      date: v.string(),
      wardId: v.string(),
      category: v.string(),
      count: v.number(),
      tempC: v.union(v.number(), v.null()),
      precipMm: v.union(v.number(), v.null()),
    }))),
    pipelineRun: v.optional(v.object({
      runId: v.string(),
      engine: v.string(),
      rowsProcessed: v.number(),
      durationSec: v.number(),
      createdAt: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    if (args.wards) {
      for await (const existing of ctx.db.query("wards")) await ctx.db.delete(existing._id);
      for (const w of args.wards) await ctx.db.insert("wards", w);
    }
    if (args.forecasts) {
      for await (const existing of ctx.db.query("forecasts")) await ctx.db.delete(existing._id);
      for (const f of args.forecasts) await ctx.db.insert("forecasts", f);
    }
    if (args.hotspots) {
      for await (const existing of ctx.db.query("hotspots")) await ctx.db.delete(existing._id);
      for (const h of args.hotspots) await ctx.db.insert("hotspots", h);
    }
    if (args.riskScores) {
      for await (const existing of ctx.db.query("riskScores")) await ctx.db.delete(existing._id);
      for (const r of args.riskScores) await ctx.db.insert("riskScores", r);
    }
    if (args.summaries) {
      for await (const existing of ctx.db.query("summaries")) await ctx.db.delete(existing._id);
      for (const s of args.summaries) await ctx.db.insert("summaries", s);
    }
    if (args.dailyAggregates) {
      for (const row of args.dailyAggregates) await ctx.db.insert("dailyAggregates", row);
    }
    if (args.pipelineRun) {
      for await (const existing of ctx.db.query("pipelineRuns")) await ctx.db.delete(existing._id);
      await ctx.db.insert("pipelineRuns", args.pipelineRun);
    }
    return { ok: true };
  },
});

// Called once before batch-importing daily aggregates to clear stale rows
export const clearDailyAggregates = mutation({
  args: {},
  handler: async (ctx) => {
    for await (const row of ctx.db.query("dailyAggregates")) {
      await ctx.db.delete(row._id);
    }
    return { ok: true };
  },
});
