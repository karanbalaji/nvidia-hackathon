"use client";
import { useMap311 } from "@/context/map-context";

export function MapLegend() {
  const { activeLayer } = useMap311();

  if (activeLayer === "none" || activeLayer === "hotspot") {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-[1000] p-4 bg-gray-950/90 border border-gray-800 rounded-lg shadow-lg backdrop-blur-sm max-w-xs font-sans text-xs">
      {activeLayer === "heat" && (
        <div>
          <div className="font-semibold text-gray-400 mb-2 tracking-wider uppercase font-mono">
            HEAT SCALE
          </div>
          <div className="flex items-center gap-1 mb-1">
            <div className="h-3 flex-1 rounded-sm bg-[#0B1B3A]" />
            <div className="h-3 flex-1 rounded-sm bg-[#14306B]" />
            <div className="h-3 flex-1 rounded-sm bg-[#1E5EFF]" />
            <div className="h-3 flex-1 rounded-sm bg-[#5B8BFF]" />
            <div className="h-3 flex-1 rounded-sm bg-[#A9C4FF]" />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-gray-500 uppercase">
            <span>MIN</span>
            <span>MAX</span>
          </div>
        </div>
      )}

      {activeLayer === "risk" && (
        <div>
          <div className="font-semibold text-gray-400 mb-2 tracking-wider uppercase font-mono">
            RISK SCALE
          </div>
          <div className="flex items-center gap-1 mb-1">
            <div className="h-3 flex-1 rounded-sm bg-[#10B981]" title="Low (0-20)" />
            <div className="h-3 flex-1 rounded-sm bg-[#84CC16]" title="Guarded (21-40)" />
            <div className="h-3 flex-1 rounded-sm bg-[#F59E0B]" title="Elevated (41-60)" />
            <div className="h-3 flex-1 rounded-sm bg-[#F97316]" title="High (61-80)" />
            <div className="h-3 flex-1 rounded-sm bg-[#EF4444]" title="Severe (81-100)" />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-gray-500 uppercase">
            <span>LOW</span>
            <span>SEVERE</span>
          </div>
        </div>
      )}
    </div>
  );
}
