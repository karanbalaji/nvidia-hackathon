"use client";
import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { useWard } from "@/context/ward-context";
import { subDays, format } from "date-fns";
import TorontoMap from "@/components/map/toronto-map";
import { WardLayer } from "@/components/map/ward-layer";
import { HotspotLayer } from "@/components/map/hotspot-layer";
import { MapControls } from "@/components/map/map-controls";
import { MapLegend } from "@/components/map/map-legend";
import { WardDetailPanel } from "@/components/map/ward-detail-panel";

type ActiveLayer = "heat" | "hotspot" | "risk" | "none";

export default function MapView() {
  const { activeCategory, selectedWardId, setSelectedWardId } = useWard();
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>("heat");
  const [dateRangeDays, setDateRangeDays] = useState(30);

  const dateRange = useMemo(() => {
    const to = format(new Date(), "yyyy-MM-dd");
    const from = format(subDays(new Date(), dateRangeDays), "yyyy-MM-dd");
    return { from, to };
  }, [dateRangeDays]);

  const dailyAggregates = useQuery(api.queries.getDailyAggregates, {
    category: activeCategory !== "all" ? activeCategory : undefined,
    from: dateRange.from,
    to: dateRange.to,
  });

  const hotspots = useQuery(api.queries.getHotspots, {
    category: activeCategory !== "all" ? activeCategory : undefined,
  });

  const riskScores = useQuery(api.queries.getRiskScores, {});

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Floating controls (outside MapContainer to avoid Leaflet DOM conflicts) */}
      <MapControls
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
        dateRangeDays={dateRangeDays}
        onDateRangeChange={setDateRangeDays}
      />

      <MapLegend activeLayer={activeLayer} />

      {/* Ward detail panel slides in from right */}
      <WardDetailPanel
        wardId={selectedWardId}
        onClose={() => setSelectedWardId(null)}
      />

      {/* Map fills the container */}
      <TorontoMap>
        <WardLayer
          activeLayer={activeLayer}
          heatData={dailyAggregates ?? []}
          riskData={riskScores ?? []}
          onWardClick={setSelectedWardId}
        />
        {activeLayer === "hotspot" && (
          <HotspotLayer
            data={hotspots ?? []}
            category={activeCategory !== "all" ? activeCategory : undefined}
          />
        )}
      </TorontoMap>

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-border/30 bg-card/70 backdrop-blur-sm flex items-center px-4 gap-4 z-[500]">
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
          311 Pulse
        </span>
        <div className="h-3 w-px bg-border/50" />
        <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
          <span className="size-1.5 bg-emerald-500 rounded-full" />
          {hotspots ? `${hotspots.length} hotspots` : "Loading..."}
        </span>
        <div className="h-3 w-px bg-border/50" />
        <span className="text-[9px] font-bold text-muted-foreground">
          {dailyAggregates ? `${dailyAggregates.length} records` : "—"}
        </span>
      </div>
    </div>
  );
}
