"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import dynamic from "next/dynamic";
import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { PulseChat } from "@/components/chat/pulse-chat";
import { MapSkeleton } from "@/components/map/map-skeleton";

const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

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

        <main className="flex-1 relative overflow-hidden">
          <MapView />
        </main>

        <PulseChat />
      </div>
    </div>
  );
}
