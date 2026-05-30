"use client";
import React, { createContext, useContext, useRef, useCallback, useState } from "react";
import type { Hotspot } from "@311pulse/contracts";
import type L from "leaflet";

type MapCtx = {
  highlightWards: (wardIds: string[]) => void;
  clearHighlights: () => void;
  pushHeatLayer: (data: Hotspot[]) => void;
  setActiveLayer: (layer: "heat" | "hotspot" | "risk" | "none") => void;
  registerMap: (ref: L.Map | null) => void;
  highlightedWardIds: string[];
  activeLayer: "heat" | "hotspot" | "risk" | "none";
  heatLayerData: Hotspot[];
};

const MapContext = createContext<MapCtx>({
  highlightWards: () => {},
  clearHighlights: () => {},
  pushHeatLayer: () => {},
  setActiveLayer: () => {},
  registerMap: () => {},
  highlightedWardIds: [],
  activeLayer: "heat",
  heatLayerData: [],
});

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<L.Map | null>(null);
  const [highlightedWardIds, setHighlightedWardIds] = useState<string[]>([]);
  const [activeLayer, setActiveLayer] = useState<"heat" | "hotspot" | "risk" | "none">("heat");
  const [heatLayerData, setHeatLayerData] = useState<Hotspot[]>([]);

  const registerMap = useCallback((map: L.Map | null) => {
    mapRef.current = map;
  }, []);

  const highlightWards = useCallback((wardIds: string[]) => {
    setHighlightedWardIds(wardIds);
  }, []);

  const clearHighlights = useCallback(() => {
    setHighlightedWardIds([]);
  }, []);

  const pushHeatLayer = useCallback((data: Hotspot[]) => {
    setHeatLayerData(data);
  }, []);

  return (
    <MapContext.Provider
      value={{
        highlightWards,
        clearHighlights,
        pushHeatLayer,
        setActiveLayer,
        registerMap,
        highlightedWardIds,
        activeLayer,
        heatLayerData,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export const useMap311 = () => useContext(MapContext);
