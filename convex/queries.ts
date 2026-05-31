import { query } from "./_generated/server";
import { v } from "convex/values";

// listWards(): Ward[]
export const listWards = query({
  args: {},
  handler: async (ctx) => ctx.db.query("wards").collect(),
});

// getDailyAggregates({ wardId?, category?, from?, to? }): DailyAggregate[]
export const getDailyAggregates = query({
  args: {
    wardId: v.optional(v.string()),
    category: v.optional(v.string()),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
  },
  handler: async (ctx, { wardId, category, from, to }) => {
    // Default to last 90 days to stay well under Convex's 32k doc read limit.
    // With 140k rows spanning 3 years, 90 days ≈ ~11k rows (all wards/categories).
    const defaultFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const dateFrom = from ?? defaultFrom;

    // Use the by_date index to scan only the requested window — avoids full
    // table scan which exceeds Convex's 32k document limit on 140k rows.
    let q = ctx.db
      .query("dailyAggregates")
      .withIndex("by_date", (idx) =>
        to ? idx.gte("date", dateFrom).lte("date", to) : idx.gte("date", dateFrom)
      );

    let rows = await q.take(8192);

    if (wardId) rows = rows.filter((r) => r.wardId === wardId);
    if (category) rows = rows.filter((r) => r.category === category);
    return rows.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4096);
  },
});

// getForecast({ wardId?, category? }): Forecast[]
export const getForecast = query({
  args: {
    wardId: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { wardId, category }) => {
    let rows = await ctx.db.query("forecasts").collect();
    if (wardId) rows = rows.filter((r) => r.wardId === wardId);
    if (category) rows = rows.filter((r) => r.category === category);
    return rows.sort((a, b) => b.predictedCount - a.predictedCount);
  },
});

// getHotspots({ category? }): Hotspot[]
export const getHotspots = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, { category }) => {
    let rows = await ctx.db.query("hotspots").collect();
    if (category) rows = rows.filter((r) => r.category === category);
    return rows.sort((a, b) => b.intensity - a.intensity);
  },
});

// getRiskScores({ wardId?, category? }): RiskScore[]
export const getRiskScores = query({
  args: {
    wardId: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { wardId, category }) => {
    let rows = await ctx.db.query("riskScores").collect();
    if (wardId) rows = rows.filter((r) => r.wardId === wardId);
    if (category) rows = rows.filter((r) => r.category === category);
    return rows.sort((a, b) => b.score - a.score);
  },
});

// searchSummaries({ query, limit? })
export const searchSummaries = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: q, limit }) => {
    const rows = await ctx.db.query("summaries").collect();
    const lower = q.toLowerCase();
    const filtered = rows.filter(
      (r) =>
        r.summary.toLowerCase().includes(lower) ||
        r.category.toLowerCase().includes(lower) ||
        r.wardId.toLowerCase().includes(lower)
    );
    return filtered.slice(0, limit ?? 10);
  },
});

// getPipelineRun(): PipelineRun | null
export const getPipelineRun = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("pipelineRuns").order("desc").first();
    return rows ?? null;
  },
});
