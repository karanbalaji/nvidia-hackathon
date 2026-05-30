import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  wards: defineTable({
    wardId: v.string(),
    wardName: v.string(),
    neighbourhoods: v.array(v.string()),
  }).index("by_ward", ["wardId"]),

  dailyAggregates: defineTable({
    date: v.string(),
    wardId: v.string(),
    category: v.string(),
    count: v.number(),
    tempC: v.union(v.number(), v.null()),
    precipMm: v.union(v.number(), v.null()),
  })
    .index("by_ward_category", ["wardId", "category"])
    .index("by_date", ["date"])
    .index("by_ward", ["wardId"])
    .index("by_category", ["category"]),

  forecasts: defineTable({
    wardId: v.string(),
    category: v.string(),
    horizonStart: v.string(),
    horizonEnd: v.string(),
    predictedCount: v.number(),
    confidenceLow: v.number(),
    confidenceHigh: v.number(),
    method: v.string(),
  })
    .index("by_ward", ["wardId"])
    .index("by_category", ["category"])
    .index("by_ward_category", ["wardId", "category"]),

  hotspots: defineTable({
    category: v.string(),
    wardId: v.string(),
    neighbourhood: v.union(v.string(), v.null()),
    centroidLat: v.number(),
    centroidLng: v.number(),
    intensity: v.number(),
    count: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_ward", ["wardId"]),

  riskScores: defineTable({
    wardId: v.string(),
    category: v.string(),
    score: v.number(),
    drivers: v.array(v.string()),
    asOf: v.string(),
  })
    .index("by_ward", ["wardId"])
    .index("by_category", ["category"]),

  summaries: defineTable({
    category: v.string(),
    wardId: v.string(),
    period: v.string(),
    summary: v.string(),
  })
    .index("by_category", ["category"])
    .index("by_ward", ["wardId"]),

  pipelineRuns: defineTable({
    runId: v.string(),
    engine: v.string(),
    rowsProcessed: v.number(),
    durationSec: v.number(),
    createdAt: v.string(),
  }).index("by_run_id", ["runId"]),
});
