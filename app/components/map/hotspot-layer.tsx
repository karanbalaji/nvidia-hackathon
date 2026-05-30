"use client";
import { CircleMarker, Popup } from "react-leaflet";
import type { Hotspot } from "@311pulse/contracts";
import { CATEGORY_COLORS } from "@/lib/category-colors";

export { CATEGORY_COLORS };

type HotspotLayerProps = {
  data: Hotspot[];
  category?: string;
};

export function HotspotLayer({ data, category }: HotspotLayerProps) {
  const filtered = category && category !== "all" ? data.filter((h) => h.category === category) : data;

  return (
    <>
      {filtered.map((hotspot, i) => {
        const radius = 8 + hotspot.intensity * 16;
        const color = CATEGORY_COLORS[hotspot.category] ?? CATEGORY_COLORS.other;
        return (
          <CircleMarker
            key={`${hotspot.wardId}-${hotspot.category}-${i}`}
            center={[hotspot.centroidLat, hotspot.centroidLng]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.7,
              color: "#ffffff",
              weight: 2,
              opacity: 0.6,
            }}
          >
            <Popup>
              <div className="text-xs font-bold capitalize">{hotspot.category}</div>
              <div className="text-xs text-muted-foreground">
                {hotspot.count} requests · intensity {hotspot.intensity.toFixed(2)}
              </div>
              {hotspot.neighbourhood && (
                <div className="text-xs text-muted-foreground">{hotspot.neighbourhood}</div>
              )}
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
