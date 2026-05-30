import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const geojsonPath = path.join(
      process.cwd(),
      "../pipeline/data/geo/wards.geojson"
    );
    const fileContents = fs.readFileSync(geojsonPath, "utf8");
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error loading wards GeoJSON:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to load wards GeoJSON: " + message },
      { status: 500 }
    );
  }
}
