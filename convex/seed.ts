import { internalMutation } from "./_generated/server";

export const seedMockData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear and seed wards
    for await (const r of ctx.db.query("wards")) await ctx.db.delete(r._id);
    const wards = [
      { wardId: "ward-01", wardName: "Etobicoke North", neighbourhoods: ["Humber Summit", "Rexdale"] },
      { wardId: "ward-02", wardName: "Scarborough Southwest", neighbourhoods: ["Birchcliffe", "Cliffside"] },
      { wardId: "ward-03", wardName: "Toronto Centre", neighbourhoods: ["Regent Park", "Cabbagetown"] },
    ];
    for (const w of wards) await ctx.db.insert("wards", w);

    // Seed forecasts
    for await (const r of ctx.db.query("forecasts")) await ctx.db.delete(r._id);
    const horizon = { horizonStart: "2026-06-01", horizonEnd: "2026-06-07" };
    const forecastData = [
      { wardId: "ward-01", category: "pothole", predictedCount: 42, confidenceLow: 35, confidenceHigh: 50, method: "movingavg", ...horizon },
      { wardId: "ward-02", category: "pothole", predictedCount: 38, confidenceLow: 30, confidenceHigh: 46, method: "movingavg", ...horizon },
      { wardId: "ward-03", category: "pothole", predictedCount: 19, confidenceLow: 14, confidenceHigh: 25, method: "movingavg", ...horizon },
      { wardId: "ward-01", category: "flooding", predictedCount: 11, confidenceLow: 7, confidenceHigh: 16, method: "movingavg", ...horizon },
      { wardId: "ward-02", category: "flooding", predictedCount: 8, confidenceLow: 5, confidenceHigh: 12, method: "movingavg", ...horizon },
    ];
    for (const f of forecastData) await ctx.db.insert("forecasts", f);

    // Seed hotspots
    for await (const r of ctx.db.query("hotspots")) await ctx.db.delete(r._id);
    const hotspotData = [
      { category: "pothole", wardId: "ward-01", neighbourhood: "Humber Summit", centroidLat: 43.74, centroidLng: -79.59, intensity: 0.88, count: 34 },
      { category: "pothole", wardId: "ward-02", neighbourhood: "Birchcliffe", centroidLat: 43.69, centroidLng: -79.26, intensity: 0.72, count: 28 },
      { category: "flooding", wardId: "ward-01", neighbourhood: "Rexdale", centroidLat: 43.73, centroidLng: -79.58, intensity: 0.61, count: 15 },
    ];
    for (const h of hotspotData) await ctx.db.insert("hotspots", h);

    // Seed risk scores
    for await (const r of ctx.db.query("riskScores")) await ctx.db.delete(r._id);
    const riskData = [
      { wardId: "ward-01", category: "pothole", score: 82, drivers: ["rising 14-day trend", "heavy rain forecast"], asOf: "2026-05-29" },
      { wardId: "ward-02", category: "pothole", score: 74, drivers: ["above-baseline request volume"], asOf: "2026-05-29" },
      { wardId: "ward-01", category: "flooding", score: 68, drivers: ["heavy rain forecast", "low-lying area"], asOf: "2026-05-29" },
    ];
    for (const r of riskData) await ctx.db.insert("riskScores", r);

    // Seed summaries
    for await (const r of ctx.db.query("summaries")) await ctx.db.delete(r._id);
    await ctx.db.insert("summaries", {
      category: "pothole",
      wardId: "ward-01",
      period: "2025-Q1",
      summary: "Etobicoke North pothole requests rose 28% following the February thaw, with 34 hotspot clusters in the Humber Summit area.",
    });

    // Seed pipeline run
    for await (const r of ctx.db.query("pipelineRuns")) await ctx.db.delete(r._id);
    await ctx.db.insert("pipelineRuns", {
      runId: "mock-run-001",
      engine: "pandas",
      rowsProcessed: 150,
      durationSec: 0.1,
      createdAt: new Date().toISOString(),
    });

    return { seeded: true };
  },
});
