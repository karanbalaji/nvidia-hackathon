"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, useRef } from "react";
import { GeoJSON } from "react-leaflet";
import { useMap311 } from "@/context/map-context";
import { severityBand } from "@/lib/severity";
import type { DailyAggregate, RiskScore } from "@311pulse/contracts";
import type L from "leaflet";

interface WardLayerProps {
  activeLayer: "heat" | "hotspot" | "risk" | "none";
  heatData: DailyAggregate[];
  riskData: RiskScore[];
  onWardClick: (wardId: string) => void;
}

export function WardLayer({
  activeLayer,
  heatData,
  riskData,
  onWardClick,
}: WardLayerProps) {
  const { highlightedWardIds } = useMap311();
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    fetch("/api/wards-geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch GeoJSON");
        return res.json();
      })
      .then((data) => {
        setGeoJsonData(data);
      })
      .catch((err) => console.error("Error loading ward GeoJSON:", err));
  }, []);

  // Aggregate heat data counts by wardId
  const heatMap = React.useMemo(() => {
    const map = new Map<string, number>();
    heatData.forEach((d) => {
      const current = map.get(d.wardId) ?? 0;
      map.set(d.wardId, current + d.count);
    });
    return map;
  }, [heatData]);

  const maxHeatCount = React.useMemo(() => {
    let max = 0;
    heatMap.forEach((val) => {
      if (val > max) max = val;
    });
    return max || 1;
  }, [heatMap]);

  // Map risk scores by wardId
  const riskMap = React.useMemo(() => {
    const map = new Map<string, number>();
    riskData.forEach((r) => {
      map.set(r.wardId, r.score);
    });
    return map;
  }, [riskData]);

  const getHeatColor = (count: number, max: number) => {
    if (count === 0) return "#0B1B3A";
    const ratio = count / max;
    if (ratio <= 0.2) return "#0B1B3A";
    if (ratio <= 0.4) return "#14306B";
    if (ratio <= 0.6) return "#1E5EFF";
    if (ratio <= 0.8) return "#5B8BFF";
    return "#A9C4FF";
  };

  const getFeatureStyle = React.useCallback((feature: any): L.PathOptions => {
    const rawWardId = feature.properties?.wardId || feature.properties?.WARD_ID || "";
    // Standardize ID to ward-XX format
    let wardId = String(rawWardId).toLowerCase();
    if (wardId && !wardId.startsWith("ward-")) {
      const numStr = wardId.replace(/\D/g, "");
      if (numStr) wardId = `ward-${numStr.padStart(2, "0")}`;
    }

    // 1. Is this ward highlighted by the AI agent?
    if (highlightedWardIds.includes(wardId)) {
      return {
        fillColor: "#1E5EFF",
        fillOpacity: 0.6,
        color: "#FFFFFF",
        weight: 2,
        opacity: 0.9,
      };
    }

    // 2. Otherwise style based on the active map layer
    switch (activeLayer) {
      case "risk": {
        const score = riskMap.get(wardId) ?? 0;
        const color = score > 0 ? severityBand(score).hex : "#1F2937";
        return {
          fillColor: color,
          fillOpacity: score > 0 ? 0.55 : 0.1,
          color: "hsl(var(--border))",
          weight: 1,
          opacity: 0.5,
        };
      }
      case "heat": {
        const count = heatMap.get(wardId) ?? 0;
        const color = getHeatColor(count, maxHeatCount);
        return {
          fillColor: color,
          fillOpacity: count > 0 ? 0.6 : 0.1,
          color: "hsl(var(--border))",
          weight: 1,
          opacity: 0.5,
        };
      }
      case "none":
      case "hotspot":
      default:
        return {
          fillColor: "transparent",
          fillOpacity: 0,
          color: "hsl(var(--border))",
          weight: 1,
          opacity: 0.3,
        };
    }
  }, [highlightedWardIds, activeLayer, riskMap, heatMap, maxHeatCount]);

  // Whenever highlightedWardIds or activeLayer changes, we need to refresh styles on the GeoJSON layer
  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.eachLayer((layer: any) => {
        if (layer.feature) {
          layer.setStyle(getFeatureStyle(layer.feature));
        }
      });
    }
  }, [highlightedWardIds, activeLayer, heatData, riskData, getFeatureStyle]);

  if (!geoJsonData) return null;

  return (
    <GeoJSON
      ref={(ref: any) => {
        geoJsonRef.current = ref;
      }}
      data={geoJsonData}
      style={getFeatureStyle}
      eventHandlers={{
        click: (e: any) => {
          const feature = e.target.feature;
          const rawWardId = feature?.properties?.wardId || feature?.properties?.WARD_ID || "";
          let wardId = String(rawWardId).toLowerCase();
          if (wardId && !wardId.startsWith("ward-")) {
            const numStr = wardId.replace(/\D/g, "");
            if (numStr) wardId = `ward-${numStr.padStart(2, "0")}`;
          }
          if (wardId) {
            onWardClick(wardId);
          }
        },
        mouseover: (e: any) => {
          const layer = e.target;
          layer.setStyle({
            fillOpacity: 0.85,
            weight: 2,
            color: "var(--color-primary, #1E5EFF)",
          });
        },
        mouseout: (e: any) => {
          const layer = e.target;
          if (layer.feature) {
            layer.setStyle(getFeatureStyle(layer.feature));
          }
        },
      }}
    />
  );
}
