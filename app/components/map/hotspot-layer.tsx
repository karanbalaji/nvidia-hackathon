"use client";

import React from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { CATEGORY_COLOR } from "@/components/shared/category-badge";
import type { Hotspot } from "@311pulse/contracts";

interface HotspotLayerProps {
  data: Hotspot[];
  category: string;
}

export function HotspotLayer({ data, category }: HotspotLayerProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Filter hotspots matching category (if category is not "all")
  const filteredData = category === "all" ? data : data.filter((h) => h.category.toLowerCase() === category.toLowerCase());

  return (
    <>
      {filteredData.map((hotspot, idx) => {
        const catColor = CATEGORY_COLOR[hotspot.category.toLowerCase()] || CATEGORY_COLOR.other;
        const radius = 8 + hotspot.intensity * 16;

        return (
          <CircleMarker
            key={`${hotspot.wardId}-${hotspot.category}-${idx}`}
            center={[hotspot.centroidLat, hotspot.centroidLng]}
            radius={radius}
            pathOptions={{
              fillColor: catColor,
              fillOpacity: 0.5 + hotspot.intensity * 0.4,
              color: "#FFFFFF",
              weight: 1.5,
              opacity: 0.6,
            }}
          >
            <Popup>
              <div className="font-sans text-xs p-1 space-y-1">
                <p className="font-bold text-gray-900 capitalize">
                  {hotspot.category} Hotspot
                </p>
                {hotspot.neighbourhood && (
                  <p className="text-gray-600 font-medium text-[10px]">
                    Area: {hotspot.neighbourhood}
                  </p>
                )}
                <p className="text-gray-500 text-[10px]">
                  Ward ID: <span className="font-mono">{hotspot.wardId}</span>
                </p>
                <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between gap-4 font-mono text-[10px]">
                  <span>Requests: {hotspot.count}</span>
                  <span>Intensity: {hotspot.intensity.toFixed(2)}</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
