"use client";
import { useEffect } from "react";
import { useMap311 } from "@/context/map-context";

interface WardHighlightProps {
  wardIds: string[];
}

export function WardHighlight({ wardIds }: WardHighlightProps) {
  const { highlightWards, clearHighlights } = useMap311();

  useEffect(() => {
    highlightWards(wardIds);
    return () => {
      clearHighlights();
    };
  }, [wardIds, highlightWards, clearHighlights]);

  return null;
}
