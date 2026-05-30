"use client";
import { createContext, useContext, useRef, useCallback } from "react";

type MapCtx = {
  highlightWards: (wardIds: string[]) => void;
  clearHighlights: () => void;
  pushHeatLayer: (data: import("@311pulse/contracts").Hotspot[]) => void;
  setActiveLayer: (layer: "heat" | "hotspot" | "risk" | "none") => void;
  registerMap: (ref: L.Map | null) => void;
};

const MapContext = createContext<MapCtx>({
  highlightWards: () => {},
  clearHighlights: () => {},
  pushHeatLayer: () => {},
  setActiveLayer: () => {},
  registerMap: () => {},
} as MapCtx);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const highlightedRef = useRef<import("leaflet").Layer[]>([]);

  const registerMap = useCallback((map: import("leaflet").Map | null) => {
    mapRef.current = map;
  }, []);

  const highlightWards = useCallback((wardIds: string[]) => {
    // Implementation fills ward polygons with primary blue at 0.4 opacity
    // Store layers in highlightedRef for cleanup
  }, []);

  const clearHighlights = useCallback(() => {
    highlightedRef.current.forEach(l => mapRef.current?.removeLayer(l));
    highlightedRef.current = [];
  }, []);

  const pushHeatLayer = useCallback(() => {}, []);
  const setActiveLayer = useCallback(() => {}, []);

  return (
    <MapContext.Provider value={{ highlightWards, clearHighlights, pushHeatLayer, setActiveLayer, registerMap }}>
      {children}
    </MapContext.Provider>
  );
}

export const useMap311 = () => useContext(MapContext);
