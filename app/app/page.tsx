"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useWard } from "@/context/ward-context";
import { useMap311 } from "@/context/map-context";
import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { MapSkeleton } from "@/components/map/map-skeleton";
import { MapControls } from "@/components/map/map-controls";
import { MapLegend } from "@/components/map/map-legend";
import { WardDetailPanel } from "@/components/map/ward-detail-panel";

const TorontoMap = dynamic(() => import("@/components/map/toronto-map"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

const WardLayer = dynamic(() => import("@/components/map/ward-layer").then((m) => m.WardLayer), {
  ssr: false,
});

const HotspotLayer = dynamic(() => import("@/components/map/hotspot-layer").then((m) => m.HotspotLayer), {
  ssr: false,
});

const PulseChat = dynamic(() => import("@/components/chat/pulse-chat").then((m) => m.PulseChat), {
  ssr: false,
});

const EMPTY_ARRAY: any[] = [];

export default function HomePage() {
  const { selectedWardId, setSelectedWardId, activeCategory } = useWard();
  const { activeLayer } = useMap311();
  const [dateRange, setDateRange] = useState("30d");

  // Convex Queries
  const WardsData = useQuery(api.queries.listWards) ?? EMPTY_ARRAY;
  const dailyAggregates = useQuery(api.queries.getDailyAggregates, {
    category: activeCategory === "all" ? undefined : activeCategory,
  }) ?? EMPTY_ARRAY;
  const hotspots = useQuery(api.queries.getHotspots, {
    category: activeCategory === "all" ? undefined : activeCategory,
  }) ?? EMPTY_ARRAY;
  const riskScores = useQuery(api.queries.getRiskScores, {}) ?? EMPTY_ARRAY;
  const forecasts = useQuery(api.queries.getForecast, {
    category: activeCategory === "all" ? undefined : activeCategory,
  }) ?? EMPTY_ARRAY;
  const pipelineRun = useQuery(api.queries.getPipelineRun);

  // Selected Ward Details
  const selectedWard = useMemo(() => {
    if (!selectedWardId) return null;
    return WardsData.find((w) => w.wardId === selectedWardId) ?? null;
  }, [WardsData, selectedWardId]);

  const selectedRiskScore = useMemo(() => {
    if (!selectedWardId) return null;
    return riskScores.find((r) => r.wardId === selectedWardId) ?? null;
  }, [riskScores, selectedWardId]);

  const selectedForecast = useMemo(() => {
    if (!selectedWardId) return null;
    return forecasts.find((f) => f.wardId === selectedWardId) ?? null;
  }, [forecasts, selectedWardId]);

  const selectedWardDailyAggs = useMemo(() => {
    if (!selectedWardId) return [];
    return dailyAggregates
      .filter((d) => d.wardId === selectedWardId)
      .map((d) => ({ date: d.date, count: d.count }));
  }, [dailyAggregates, selectedWardId]);

  const isGPU = pipelineRun?.engine === "rapids";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Map area controls */}
          <MapControls dateRange={dateRange} setDateRange={setDateRange} />
          <MapLegend />

          {/* Ward Details Panel */}
          <WardDetailPanel
            ward={selectedWard}
            riskScore={selectedRiskScore}
            forecast={selectedForecast}
            miniChartData={selectedWardDailyAggs}
            onClose={() => setSelectedWardId(null)}
          />

          {/* Root Toronto Map */}
          <div className="flex-1 w-full h-full z-0">
            <TorontoMap>
              <WardLayer
                activeLayer={activeLayer}
                heatData={dailyAggregates}
                riskData={riskScores}
                onWardClick={setSelectedWardId}
              />
              <HotspotLayer data={hotspots} category={activeCategory} />
            </TorontoMap>
          </div>

          {/* Bottom Status Bar */}
          <div className="h-8 border-t border-border bg-gray-950 px-6 flex items-center gap-4 shrink-0 z-10 font-mono text-[9px] text-gray-500 uppercase tracking-widest">
            <span>311 Pulse Console</span>
            <div className="h-3 w-px bg-gray-800" />
            <span className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${pipelineRun ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
              Engine: {pipelineRun?.engine || "Pandas"} {isGPU ? "(⚡ GPU)" : "(CPU)"}
            </span>
            <div className="h-3 w-px bg-gray-800" />
            <span>LLM: NIM / Nemotron</span>
            {pipelineRun && (
              <>
                <div className="h-3 w-px bg-gray-800" />
                <span>Rows: {pipelineRun.rowsProcessed.toLocaleString("en-CA")}</span>
              </>
            )}
          </div>
        </main>

        <PulseChat />
      </div>
    </div>
  );
}
