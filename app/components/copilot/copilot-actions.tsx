"use client";
import { useCopilotAction } from "@copilotkit/react-core";
import { ForecastBarChart } from "@/components/generative-ui/forecast-bar-chart";
import { TrendLineChart } from "@/components/generative-ui/trend-line-chart";
import { HotspotMapAction } from "@/components/generative-ui/hotspot-map-action";
import { RiskPanel } from "@/components/generative-ui/risk-panel";
import { WardHighlight } from "@/components/generative-ui/ward-highlight";
import { InsightCard } from "@/components/generative-ui/insight-card";
import { ChartSkeleton } from "@/components/shared/chart-skeleton";
import { severityBand } from "@/lib/severity";
import type { Forecast, DailyAggregate, Hotspot, RiskScore } from "@311pulse/contracts";

// AG-UI may deliver a tool result as a bare array, a JSON string, or an object
// wrapping the array (e.g. { data: [...] }). Coerce defensively so a render never
// crashes the app with "x.map is not a function".
function asArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  if (result && typeof result === "object") {
    const inner = (result as { data?: unknown; result?: unknown }).data ??
      (result as { data?: unknown; result?: unknown }).result;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

export function CopilotActions() {
  useCopilotAction({
    name: "getForecast",
    available: "remote",
    description: "Retrieve 7-day service request count forecasts for a category and optional ward.",
    parameters: [
      {
        name: "category",
        type: "string",
        description: "Service request category (e.g. pothole, flooding, garbage)",
        required: false,
      },
      {
        name: "wardId",
        type: "string",
        description: "Specific Toronto Ward ID (e.g. ward-14)",
        required: false,
      },
    ],
    render: ({ status, result }) => {
      if (status !== "complete") return <ChartSkeleton />;
      const data = asArray<Forecast>(result);
      const ranked = [...data].sort((a, b) => b.predictedCount - a.predictedCount);
      const topWardIds = ranked.slice(0, 3).map((d) => d.wardId);
      const category = ranked[0]?.category ?? "service";
      return (
        <>
          <WardHighlight wardIds={topWardIds} />
          <InsightCard
            recommendation={
              topWardIds.length > 0
                ? {
                    text: `Pre-position ${category} crews in ${topWardIds.join(", ")} ahead of the forecasted surge.`,
                    wardIds: topWardIds,
                  }
                : undefined
            }
          >
            <ForecastBarChart data={data} />
          </InsightCard>
        </>
      );
    },
  });

  useCopilotAction({
    name: "queryRequests",
    available: "remote",
    description: "Get historical complaint trend lines with precipitation and temperature correlations.",
    parameters: [
      {
        name: "category",
        type: "string",
        description: "Service request category",
        required: false,
      },
      {
        name: "wardId",
        type: "string",
        description: "Specific Toronto Ward ID",
        required: false,
      },
      {
        name: "from",
        type: "string",
        description: "Start date (YYYY-MM-DD)",
        required: false,
      },
      {
        name: "to",
        type: "string",
        description: "End date (YYYY-MM-DD)",
        required: false,
      },
    ],
    render: ({ status, result }) => {
      if (status !== "complete") return <ChartSkeleton />;
      const data = asArray<DailyAggregate>(result);
      return (
        <InsightCard>
          <TrendLineChart data={data} category={data[0]?.category} />
        </InsightCard>
      );
    },
  });

  useCopilotAction({
    name: "getHotspots",
    available: "remote",
    description: "Retrieve active service request clustering hotspots for a category.",
    parameters: [
      {
        name: "category",
        type: "string",
        description: "Service request category",
        required: false,
      },
    ],
    render: ({ status, result }) => {
      if (status !== "complete") return <ChartSkeleton />;
      return (
        <InsightCard>
          <HotspotMapAction data={asArray<Hotspot>(result)} />
        </InsightCard>
      );
    },
  });

  useCopilotAction({
    name: "getRiskScore",
    available: "remote",
    description: "Get predictive risk scoring and risk drivers for specific wards.",
    parameters: [
      {
        name: "wardId",
        type: "string",
        description: "Specific Toronto Ward ID",
        required: false,
      },
    ],
    render: ({ status, result }) => {
      if (status !== "complete") return <ChartSkeleton />;
      const data = asArray<RiskScore>(result);
      const top = [...data].sort((a, b) => b.score - a.score)[0];
      return (
        <>
          <WardHighlight wardIds={data.map((d) => d.wardId)} />
          <InsightCard
            recommendation={
              top
                ? {
                    text: `${top.wardId} is at ${severityBand(top.score).label.toLowerCase()} risk for ${top.category}. Prioritize inspection and mitigation here.`,
                    drivers: top.drivers,
                    wardIds: [top.wardId],
                  }
                : undefined
            }
          >
            <RiskPanel data={data} />
          </InsightCard>
        </>
      );
    },
  });

  return null;
}
