import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // Real ward boundaries live in pipeline/data/geo/wards.geojson
    const geoPath = path.join(process.cwd(), "..", "pipeline", "data", "geo", "wards.geojson");
    const raw = await readFile(geoPath, "utf-8");
    const fc = JSON.parse(raw) as GeoJSON.FeatureCollection;

    // Normalise properties: add wardId in "ward-XX" format from AREA_SHORT_CODE
    const normalised: GeoJSON.FeatureCollection = {
      ...fc,
      features: fc.features.map((f) => {
        const code = String(f.properties?.AREA_SHORT_CODE ?? "").padStart(2, "0");
        return {
          ...f,
          properties: {
            ...f.properties,
            wardId: `ward-${code}`,
            wardName: f.properties?.AREA_NAME ?? `Ward ${code}`,
          },
        };
      }),
    };

    return NextResponse.json(normalised);
  } catch {
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }
}
