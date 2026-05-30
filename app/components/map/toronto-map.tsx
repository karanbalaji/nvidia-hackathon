"use client";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { useMap311 } from "@/context/map-context";
import L from "leaflet";

// Fix Leaflet default icon path broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

function MapRegistrar() {
  const map = useMap();
  const { registerMap } = useMap311();
  useEffect(() => {
    registerMap(map);
    return () => registerMap(null);
  }, [map, registerMap]);
  return null;
}

type TorontoMapProps = {
  children?: React.ReactNode;
};

export default function TorontoMap({ children }: TorontoMapProps) {
  return (
    <MapContainer
      center={[43.6532, -79.3832]}
      zoom={11}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
      />
      <MapRegistrar />
      {children}
    </MapContainer>
  );
}
