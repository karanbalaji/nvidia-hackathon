"use client";
import { createContext, useContext, useRef, useCallback, useEffect } from "react";
import type { Hotspot } from "@311pulse/contracts";

type ActiveLayer = "heat" | "hotspot" | "risk" | "none";

type MapCtx = {
  highlightWards: (wardIds: string[]) => void;
  clearHighlights: () => void;
  pushHeatLayer: (data: Hotspot[]) => void;
  setActiveLayer: (layer: ActiveLayer) => void;
  registerMap: (ref: import("leaflet").Map | null) => void;
};

const noop = () => {};

const MapContext = createContext<MapCtx>({
  highlightWards: noop,
  clearHighlights: noop,
  pushHeatLayer: noop,
  setActiveLayer: noop,
  registerMap: noop,
});

type Centroid = [number, number];

function ringCentroid(coords: number[][]): Centroid {
  let lat = 0;
  let lng = 0;
  coords.forEach(([x, y]) => {
    lng += x;
    lat += y;
  });
  const n = coords.length || 1;
  return [lat / n, lng / n];
}

function featureCentroid(geometry: GeoJSON.Geometry): Centroid | null {
  if (geometry.type === "Polygon") {
    return ringCentroid(geometry.coordinates[0] as number[][]);
  }
  if (geometry.type === "MultiPolygon") {
    return ringCentroid(geometry.coordinates[0][0] as number[][]);
  }
  return null;
}

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const highlightedRef = useRef<import("leaflet").Layer[]>([]);
  const centroidsRef = useRef<Map<string, Centroid>>(new Map());

  const registerMap = useCallback((map: import("leaflet").Map | null) => {
    mapRef.current = map;
  }, []);

  // Build ward centroid lookup once so agent highlights land on real wards.
  useEffect(() => {
    fetch("/api/wards-geojson")
      .then((r) => r.json())
      .then((fc: GeoJSON.FeatureCollection) => {
        const map = new Map<string, Centroid>();
        (fc.features ?? []).forEach((f) => {
          if (!f.geometry) return;
          const c = featureCentroid(f.geometry);
          if (!c) return;
          const props = (f.properties ?? {}) as Record<string, unknown>;
          [props.wardId, props.AREA_SHORT_CODE, props.AREA_NAME].forEach((key) => {
            if (typeof key === "string" && key) map.set(key, c);
          });
        });
        centroidsRef.current = map;
      })
      .catch(() => {});
  }, []);

  const clearHighlights = useCallback(() => {
    highlightedRef.current.forEach((l) => mapRef.current?.removeLayer(l));
    highlightedRef.current = [];
  }, []);

  const highlightWards = useCallback(
    (wardIds: string[]) => {
      clearHighlights();
      if (!mapRef.current || wardIds.length === 0) return;
      wardIds.forEach((wardId, i) => {
        import("leaflet").then(({ default: L }) => {
          if (!mapRef.current) return;
          // Prefer the real ward centroid; degrade to a spread near Toronto centre.
          const centroid = centroidsRef.current.get(wardId);
          const [lat, lng] = centroid ?? [
            43.6532 + (i * 0.05 - 0.1),
            -79.3832 + (i * 0.08 - 0.15),
          ];
          const icon = L.divIcon({
            className: "ward-highlight-marker",
            html: `<span class="ward-highlight-ring"></span><span class="ward-highlight-dot"></span>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          const marker = L.marker([lat, lng], { icon, interactive: true, keyboard: false });
          marker.bindTooltip(wardId, { direction: "top", offset: [0, -8] });
          marker.addTo(mapRef.current);
          if (centroid && i === 0) {
            mapRef.current.panTo([lat, lng], { animate: true });
          }
          highlightedRef.current.push(marker);
        });
      });
    },
    [clearHighlights]
  );

  // HotspotLayer renders data reactively via props; these imperative hooks are
  // exposed for agent generative UI but layer state lives in MapView.
  const pushHeatLayer = useCallback((_data: Hotspot[]) => {}, []); // eslint-disable-line @typescript-eslint/no-unused-vars
  const setActiveLayer = useCallback((_layer: ActiveLayer) => {}, []); // eslint-disable-line @typescript-eslint/no-unused-vars

  return (
    <MapContext.Provider
      value={{ highlightWards, clearHighlights, pushHeatLayer, setActiveLayer, registerMap }}
    >
      {children}
    </MapContext.Provider>
  );
}

export const useMap311 = () => useContext(MapContext);
