import { z } from "zod";

// Ward
export const WardSchema = z.object({
  wardId: z.string(),
  wardName: z.string(),
  neighbourhoods: z.array(z.string()),
});
export const WardArraySchema = z.array(WardSchema);
export type Ward = z.infer<typeof WardSchema>;

// ServiceRequest
export const ServiceRequestSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  category: z.string(),
  wardId: z.string(),
  neighbourhood: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  status: z.string(),
});
export const ServiceRequestArraySchema = z.array(ServiceRequestSchema);
export type ServiceRequest = z.infer<typeof ServiceRequestSchema>;

// DailyAggregate
export const DailyAggregateSchema = z.object({
  date: z.string(),
  wardId: z.string(),
  category: z.string(),
  count: z.number(),
  tempC: z.number().nullable(),
  precipMm: z.number().nullable(),
});
export const DailyAggregateArraySchema = z.array(DailyAggregateSchema);
export type DailyAggregate = z.infer<typeof DailyAggregateSchema>;

// Forecast
export const ForecastSchema = z.object({
  wardId: z.string(),
  category: z.string(),
  horizonStart: z.string(),
  horizonEnd: z.string(),
  predictedCount: z.number(),
  confidenceLow: z.number(),
  confidenceHigh: z.number(),
  method: z.string(),
});
export const ForecastArraySchema = z.array(ForecastSchema);
export type Forecast = z.infer<typeof ForecastSchema>;

// Hotspot
export const HotspotSchema = z.object({
  category: z.string(),
  wardId: z.string(),
  neighbourhood: z.string().nullable(),
  centroidLat: z.number(),
  centroidLng: z.number(),
  intensity: z.number(),
  count: z.number(),
});
export const HotspotArraySchema = z.array(HotspotSchema);
export type Hotspot = z.infer<typeof HotspotSchema>;

// RiskScore
export const RiskScoreSchema = z.object({
  wardId: z.string(),
  category: z.string(),
  score: z.number(),
  drivers: z.array(z.string()),
  asOf: z.string(),
});
export const RiskScoreArraySchema = z.array(RiskScoreSchema);
export type RiskScore = z.infer<typeof RiskScoreSchema>;

// PipelineRun
export const PipelineRunSchema = z.object({
  runId: z.string(),
  engine: z.enum(["pandas", "polars", "duckdb", "rapids"]),
  rowsProcessed: z.number(),
  durationSec: z.number(),
  createdAt: z.string(),
});
export const PipelineRunArraySchema = z.array(PipelineRunSchema);
export type PipelineRun = z.infer<typeof PipelineRunSchema>;
