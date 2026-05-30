import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const artifactsPath = path.join(process.cwd(), "..", "pipeline", "artifacts", "wards.json");
    const raw = await readFile(artifactsPath, "utf-8");
    const wards = JSON.parse(raw) as Array<{
      wardId: string;
      wardName: string;
      neighbourhoods: string[];
    }>;

    // Convert Ward[] to a minimal GeoJSON FeatureCollection
    // Real GeoJSON boundaries come from pipeline; if this file is a Ward schema (no geometry),
    // return an empty FeatureCollection so the map degrades gracefully
    if (wards.length > 0 && "wardId" in wards[0] && !("geometry" in wards[0])) {
      return NextResponse.json({
        type: "FeatureCollection",
        features: [],
      });
    }

    return NextResponse.json(JSON.parse(raw));
  } catch {
    // Return empty FeatureCollection when artifacts aren't present
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }
}
