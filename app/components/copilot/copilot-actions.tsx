"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import { useCopilotAction } from "@copilotkit/react-core";
import { ForecastBarChart } from "@/components/generative-ui/forecast-bar-chart";
import { TrendLineChart } from "@/components/generative-ui/trend-line-chart";
import { HotspotMapAction } from "@/components/generative-ui/hotspot-map-action";
import { RiskPanel } from "@/components/generative-ui/risk-panel";
import { WardHighlight } from "@/components/generative-ui/ward-highlight";
import { ChartSkeleton } from "@/components/shared/chart-skeleton";
import type { Forecast, RiskScore } from "@311pulse/contracts";

export function CopilotActions() {
  // 1. Forecast Action
  useCopilotAction({
    name: "getForecast",
    available: "disabled",
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
      if (status === "inProgress") {
        return <ChartSkeleton />;
      }
      if (status === "complete" && result) {
        const data = Array.isArray(result) ? (result as Forecast[]) : [result as Forecast];
        const topWardIds = data.slice(0, 3).map((d) => d.wardId);
        return (
          <>
            <WardHighlight wardIds={topWardIds} />
            <ForecastBarChart data={data} />
          </>
        );
      }
      return <></>;
    },
  });

  // 2. Query Requests (Trend) Action
  useCopilotAction({
    name: "queryRequests",
    available: "disabled",
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
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return <ChartSkeleton />;
      }
      if (status === "complete" && result) {
        return <TrendLineChart data={result as any} category={(args as any).category || "all"} />;
      }
      return <></>;
    },
  });

  // 3. Get Hotspots Action
  useCopilotAction({
    name: "getHotspots",
    available: "disabled",
    description: "Retrieve active service request clustering hotspots for a category.",
    parameters: [
      {
        name: "category",
        type: "string",
        description: "Service request category",
        required: false,
      },
    ],
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return <ChartSkeleton />;
      }
      if (status === "complete" && result) {
        return <HotspotMapAction data={result as any} category={(args as any).category || "all"} />;
      }
      return <></>;
    },
  });

  // 4. Get Risk Score Action
  useCopilotAction({
    name: "getRiskScore",
    available: "disabled",
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
      if (status === "inProgress") {
        return <ChartSkeleton />;
      }
      if (status === "complete" && result) {
        const data = Array.isArray(result) ? (result as RiskScore[]) : [result as RiskScore];
        const wardIds = data.map((d) => d.wardId);
        return (
          <>
            <WardHighlight wardIds={wardIds} />
            <RiskPanel data={data} />
          </>
        );
      }
      return <></>;
    },
  });

  return null;
}
