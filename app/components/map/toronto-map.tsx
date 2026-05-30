"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMap311 } from "@/context/map-context";
import L from "leaflet";

// Fix Leaflet default icon paths in Next.js
if (typeof window !== "undefined") {
  // @ts-expect-error - prototype doesn't have standard typings in this context
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });
}

function MapRegistrar() {
  const map = useMap();
  const { registerMap } = useMap311();

  useEffect(() => {
    registerMap(map);
    return () => {
      registerMap(null);
    };
  }, [map, registerMap]);

  return null;
}

interface TorontoMapProps {
  children?: React.ReactNode;
}

export default function TorontoMap({ children }: TorontoMapProps) {
  return (
    <div className="w-full h-full relative" data-testid="toronto-map">
      <MapContainer
        center={[43.6532, -79.3832]}
        zoom={11}
        className="w-full h-full bg-[#030712]"
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://carto.com">CARTO</a>'
        />
        <MapRegistrar />
        {children}
      </MapContainer>
    </div>
  );
}
