import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // Prefer dedicated GeoJSON file; fall back to wards.json (legacy)
    const geojsonPath = path.join(process.cwd(), "..", "pipeline", "artifacts", "wards.geojson");
    try {
      const raw = await readFile(geojsonPath, "utf-8");
      return NextResponse.json(JSON.parse(raw));
    } catch {
      // no geojson file, try wards.json
    }

    const wardsPath = path.join(process.cwd(), "..", "pipeline", "artifacts", "wards.json");
    const raw = await readFile(wardsPath, "utf-8");
    const wards = JSON.parse(raw) as Array<Record<string, unknown>>;

    if (wards.length > 0 && "wardId" in wards[0] && !("geometry" in wards[0])) {
      return NextResponse.json({
        type: "FeatureCollection",
        features: [],
      });
    }

    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }
}
