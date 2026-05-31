"use client";
import { GeoJSON } from "react-leaflet";
import { useState, useEffect, useCallback } from "react";
import type { DailyAggregate, RiskScore } from "@311pulse/contracts";
import type { PathOptions, Layer, LeafletMouseEvent } from "leaflet";
import { severityBand } from "@/lib/severity";
import { HEAT_RAMP, MAP_STROKE } from "@/lib/chart-theme";

type ActiveLayer = "heat" | "hotspot" | "risk" | "none";

type WardLayerProps = {
  activeLayer: ActiveLayer;
  heatData: DailyAggregate[];
  riskData: RiskScore[];
  onWardClick: (wardId: string) => void;
};

type GeoJsonFeature = GeoJSON.Feature & {
  properties: { wardId?: string; wardName?: string; AREA_NAME?: string; AREA_SHORT_CODE?: string };
};

function scoreToColor(score: number): string {
  return severityBand(score).hex;
}

function heatToColor(normalised: number): string {
  const idx = Math.min(
    HEAT_RAMP.length - 1,
    Math.max(0, Math.round(normalised * (HEAT_RAMP.length - 1)))
  );
  return HEAT_RAMP[idx];
}

export function WardLayer({ activeLayer, heatData, riskData, onWardClick }: WardLayerProps) {
  const [geoJson, setGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/api/wards-geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => setGeoJson(data))
      .catch(() => {});
  }, []);

  const riskMap = new Map(riskData.map((r) => [r.wardId, r.score]));

  const heatMap = new Map<string, number>();
  heatData.forEach((d) => {
    const cur = heatMap.get(d.wardId) ?? 0;
    heatMap.set(d.wardId, cur + d.count);
  });
  const maxCount = Math.max(1, ...heatMap.values());

  const style = useCallback(
    (feature: GeoJsonFeature): PathOptions => {
      const wardId =
        feature.properties?.wardId ??
        feature.properties?.AREA_SHORT_CODE ??
        String(feature.properties?.AREA_NAME ?? "");

      if (activeLayer === "risk") {
        const score = riskMap.get(wardId) ?? 0;
        return {
          fillColor: scoreToColor(score),
          fillOpacity: 0.55,
          color: MAP_STROKE,
          weight: 1,
        };
      }

      if (activeLayer === "heat") {
        const count = heatMap.get(wardId) ?? 0;
        const normalised = count / maxCount;
        return {
          fillColor: heatToColor(normalised),
          fillOpacity: 0.5,
          color: MAP_STROKE,
          weight: 1,
        };
      }

      return {
        fillColor: "transparent",
        fillOpacity: 0,
        color: MAP_STROKE,
        weight: 1,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeLayer, riskData, heatData]
  );

  const onEachFeature = useCallback(
    (feature: GeoJsonFeature, layer: Layer) => {
      const wardId =
        feature.properties?.wardId ??
        feature.properties?.AREA_SHORT_CODE ??
        String(feature.properties?.AREA_NAME ?? "Unknown");
      const wardName =
        feature.properties?.wardName ?? feature.properties?.AREA_NAME ?? wardId;

      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          e.target.setStyle({ fillOpacity: 0.85 });
        },
        mouseout: (e: LeafletMouseEvent) => {
          e.target.setStyle({ fillOpacity: activeLayer === "none" ? 0 : 0.55 });
        },
        click: () => {
          onWardClick(String(wardId));
        },
      });

      layer.bindTooltip(String(wardName), { sticky: true, direction: "top" });
    },
    [activeLayer, onWardClick]
  );

  if (!geoJson) return null;

  return (
    <GeoJSON
      key={`ward-layer-${activeLayer}`}
      data={geoJson}
      style={style as (feature: GeoJSON.Feature | undefined) => PathOptions}
      onEachFeature={onEachFeature as (feature: GeoJSON.Feature, layer: Layer) => void}
    />
  );
}
