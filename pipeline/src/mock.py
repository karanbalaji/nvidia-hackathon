"""Write schema-valid mock artifacts to pipeline/artifacts/.

Produces all 7 artifacts needed for Phase 0/1 downstream work:
25 wards, 2 categories (pothole, flooding), 30 days of aggregates,
plus GeoJSON boundaries for map rendering.

Run with:  python -m pipeline.src.mock
"""

import hashlib
import json
import os
import random as _random
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

ARTIFACTS = Path(__file__).parent.parent / "artifacts"

# ── Toronto ward GeoJSON generator ────────────────────────────────
# Approximate rectangular boundaries for all 25 Toronto wards.
LAT_MIN, LAT_MAX = 43.58, 43.85
LNG_MIN, LNG_MAX = -79.64, -79.15

WARD_POSITIONS: list[tuple[int, int, str]] = [
    (0, 0, "ward-01"), (0, 1, "ward-02"), (0, 2, "ward-07"), (0, 3, "ward-08"), (0, 4, "ward-16"),
    (1, 0, "ward-03"), (1, 1, "ward-04"), (1, 2, "ward-09"), (1, 3, "ward-15"), (1, 4, "ward-17"),
    (2, 0, "ward-05"), (2, 1, "ward-06"), (2, 2, "ward-11"), (2, 3, "ward-14"), (2, 4, "ward-18"),
    (3, 0, "ward-20"), (3, 1, "ward-19"), (3, 2, "ward-12"), (3, 3, "ward-13"), (3, 4, "ward-21"),
    (4, 0, "ward-22"), (4, 1, "ward-25"), (4, 2, "ward-10"), (4, 3, "ward-24"), (4, 4, "ward-23"),
]

def _build_ward_geojson(ward_names: dict[str, str]) -> dict:
    ROWS, COLS = 5, 5
    lat_step = (LAT_MAX - LAT_MIN) / ROWS
    lng_step = (LNG_MAX - LNG_MIN) / COLS
    features = []
    for row, col, ward_id in WARD_POSITIONS:
        lat_bot = LAT_MIN + row * lat_step
        lat_top = LAT_MIN + (row + 1) * lat_step
        lng_left = LNG_MIN + col * lng_step
        lng_right = LNG_MIN + (col + 1) * lng_step
        seed = int(hashlib.md5(ward_id.encode()).hexdigest()[:8], 16)
        rng = _random.Random(seed)
        j = lambda: rng.uniform(-0.02 * lat_step, 0.02 * lat_step)
        k = lambda: rng.uniform(-0.02 * lng_step, 0.02 * lng_step)
        coords = [
            [lng_left + k(), lat_bot + j()],
            [lng_left + k(), lat_top + j()],
            [lng_right + k(), lat_top + j()],
            [lng_right + k(), lat_bot + j()],
            [lng_left + k(), lat_bot + j()],
        ]
        features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [coords]},
            "properties": {
                "wardId": ward_id,
                "wardName": ward_names.get(ward_id, f"Ward {ward_id}"),
                "AREA_SHORT_CODE": ward_id,
                "AREA_NAME": ward_names.get(ward_id, f"Ward {ward_id}"),
            },
        })
    return {"type": "FeatureCollection", "features": features}


def main() -> None:
    ARTIFACTS.mkdir(exist_ok=True)

    wards = [
        {"wardId": "ward-01", "wardName": "Etobicoke North", "neighbourhoods": ["Humber Summit", "Rexdale"]},
        {"wardId": "ward-02", "wardName": "Etobicoke Centre", "neighbourhoods": ["Edenbridge", "The Kingsway"]},
        {"wardId": "ward-03", "wardName": "Etobicoke-Lakeshore", "neighbourhoods": ["Mimico", "New Toronto"]},
        {"wardId": "ward-04", "wardName": "Parkdale-High Park", "neighbourhoods": ["Parkdale", "High Park"]},
        {"wardId": "ward-05", "wardName": "York South-Weston", "neighbourhoods": ["Weston", "Mount Dennis"]},
        {"wardId": "ward-06", "wardName": "York Centre", "neighbourhoods": ["Downsview", "Humber Summit"]},
        {"wardId": "ward-07", "wardName": "Humber River-Black Creek", "neighbourhoods": ["Jane-Finch", "York University Heights"]},
        {"wardId": "ward-08", "wardName": "Eglinton-Lawrence", "neighbourhoods": ["Lawrence Park", "Lytton Park"]},
        {"wardId": "ward-09", "wardName": "Davenport", "neighbourhoods": ["Davenport", "Corso Italia"]},
        {"wardId": "ward-10", "wardName": "Spadina-Fort York", "neighbourhoods": ["Spadina", "Fort York"]},
        {"wardId": "ward-11", "wardName": "University-Rosedale", "neighbourhoods": ["Yorkville", "The Annex"]},
        {"wardId": "ward-12", "wardName": "Toronto-St. Paul's", "neighbourhoods": ["Forest Hill", "Deer Park"]},
        {"wardId": "ward-13", "wardName": "Toronto Centre", "neighbourhoods": ["Regent Park", "Cabbagetown"]},
        {"wardId": "ward-14", "wardName": "Toronto-Danforth", "neighbourhoods": ["Riverdale", "Leslieville"]},
        {"wardId": "ward-15", "wardName": "Don Valley West", "neighbourhoods": ["Bridle Path", "Sunnybrook"]},
        {"wardId": "ward-16", "wardName": "Don Valley East", "neighbourhoods": ["Don Mills", "Parkway Forest"]},
        {"wardId": "ward-17", "wardName": "Don Valley North", "neighbourhoods": ["Bayview Village", "Sheppard East"]},
        {"wardId": "ward-18", "wardName": "Willowdale", "neighbourhoods": ["Willowdale", "Newtonbrook"]},
        {"wardId": "ward-19", "wardName": "Beaches-East York", "neighbourhoods": ["The Beaches", "East York"]},
        {"wardId": "ward-20", "wardName": "Scarborough Southwest", "neighbourhoods": ["Birchcliffe", "Cliffside"]},
        {"wardId": "ward-21", "wardName": "Scarborough Centre", "neighbourhoods": ["Woburn", "Bendale"]},
        {"wardId": "ward-22", "wardName": "Scarborough-Agincourt", "neighbourhoods": ["Agincourt", "West Hill"]},
        {"wardId": "ward-23", "wardName": "Scarborough North", "neighbourhoods": ["Steeles", "L'Amoreaux"]},
        {"wardId": "ward-24", "wardName": "Scarborough-Guildwood", "neighbourhoods": ["Guildwood", "West Hill"]},
        {"wardId": "ward-25", "wardName": "Scarborough-Rouge Park", "neighbourhoods": ["Rouge Park", "Morningside"]},
    ]
    _write_json("wards.json", wards)

    # Generate GeoJSON boundaries for map rendering
    ward_names = {w["wardId"]: w["wardName"] for w in wards}
    geojson = _build_ward_geojson(ward_names)
    _write_json("wards.geojson", geojson)

    # daily_aggregates.parquet — 30 days × all 25 wards × 6 categories
    today = date.today()
    rows = []
    ward_rng = {w["wardId"]: _random.Random(int(hashlib.md5(w["wardId"].encode()).hexdigest()[:8], 16)) for w in wards}
    categories = ["pothole", "flooding", "garbage", "graffiti", "tree", "noise"]
    for i in range(30):
        d = (today - timedelta(days=29 - i)).isoformat()
        for w in wards:
            rng = ward_rng[w["wardId"]]
            for cat in categories:
                base = {"pothole": 5, "flooding": 2, "garbage": 3, "graffiti": 2, "tree": 1, "noise": 4}[cat]
                trend = int(5 * (1 + (int(w["wardId"].split("-")[1]) - 13) / 25))
                rows.append({
                    "date": d,
                    "wardId": w["wardId"],
                    "category": cat,
                    "count": max(1, base + rng.randint(0, 8) + trend + (i % 3)),
                    "tempC": round(10.0 + i * 0.3 + rng.uniform(-2, 2), 1),
                    "precipMm": round(5.0 if i % 7 == 0 else rng.uniform(0, 2), 1),
                })
    df = pd.DataFrame(rows)
    df.to_parquet(ARTIFACTS / "daily_aggregates.parquet", index=False)
    print(f"  daily_aggregates.parquet: {len(df)} rows")

    horizon_start = (today + timedelta(days=1)).isoformat()
    horizon_end = (today + timedelta(days=7)).isoformat()
    forecasts = []
    for w in wards:
        wid = int(w["wardId"].split("-")[1])
        for cat in categories:
            base_pred = {"pothole": 40, "flooding": 10, "garbage": 20, "graffiti": 12, "tree": 8, "noise": 15}[cat]
            ward_offset = (wid - 13) * 2
            forecasts.append({
                "wardId": w["wardId"], "category": cat,
                "horizonStart": horizon_start, "horizonEnd": horizon_end,
                "predictedCount": max(5, base_pred + ward_offset + _random.Random(wid * 100).randint(-10, 10)),
                "confidenceLow": max(5, base_pred - 15 + ward_offset),
                "confidenceHigh": min(99, base_pred + 15 + ward_offset),
                "method": "movingavg",
            })
    _write_json("forecasts.json", forecasts)

    hotspots = [
        {"category": "pothole", "wardId": "ward-01", "neighbourhood": "Humber Summit", "centroidLat": 43.74, "centroidLng": -79.59, "intensity": 0.88, "count": 34},
        {"category": "pothole", "wardId": "ward-02", "neighbourhood": "Birchcliffe", "centroidLat": 43.69, "centroidLng": -79.26, "intensity": 0.72, "count": 28},
        {"category": "pothole", "wardId": "ward-07", "neighbourhood": "Jane-Finch", "centroidLat": 43.76, "centroidLng": -79.51, "intensity": 0.84, "count": 31},
        {"category": "pothole", "wardId": "ward-13", "neighbourhood": "Regent Park", "centroidLat": 43.66, "centroidLng": -79.36, "intensity": 0.67, "count": 22},
        {"category": "pothole", "wardId": "ward-14", "neighbourhood": "Riverdale", "centroidLat": 43.67, "centroidLng": -79.34, "intensity": 0.71, "count": 26},
        {"category": "flooding", "wardId": "ward-01", "neighbourhood": "Rexdale", "centroidLat": 43.73, "centroidLng": -79.58, "intensity": 0.61, "count": 15},
        {"category": "flooding", "wardId": "ward-10", "neighbourhood": "Fort York", "centroidLat": 43.64, "centroidLng": -79.40, "intensity": 0.55, "count": 12},
        {"category": "flooding", "wardId": "ward-19", "neighbourhood": "The Beaches", "centroidLat": 43.68, "centroidLng": -79.29, "intensity": 0.59, "count": 14},
        {"category": "garbage", "wardId": "ward-20", "neighbourhood": "Cliffside", "centroidLat": 43.71, "centroidLng": -79.24, "intensity": 0.45, "count": 18},
        {"category": "noise", "wardId": "ward-10", "neighbourhood": "Spadina", "centroidLat": 43.65, "centroidLng": -79.40, "intensity": 0.78, "count": 42},
    ]
    _write_json("hotspots.json", hotspots)

    risk_scores = []
    for w in wards:
        wid = int(w["wardId"].split("-")[1])
        for cat in categories:
            cat_mod = {"pothole": 0, "flooding": -15, "garbage": -5, "graffiti": -10, "tree": -20, "noise": 5}[cat]
            risk_scores.append({
                "wardId": w["wardId"], "category": cat,
                "score": max(10, min(99, 50 + (wid - 13) * 3 + cat_mod + _random.Random(wid).randint(-10, 10))),
                "drivers": ["synthetic mock data"],
                "asOf": today.isoformat(),
            })
    _write_json("risk_scores.json", risk_scores)

    request_summaries = []
    for w in wards:
        for cat in categories:
            request_summaries.append({
                "category": cat, "wardId": w["wardId"], "period": "2025-Q2",
                "summary": f"{w['wardName']} {cat} requests — synthetic mock data for Phase 0 testing.",
            })
    # Add a couple richer summaries
    request_summaries[:3] = [
        {"category": "pothole", "wardId": "ward-01", "period": "2025-Q1", "summary": "Etobicoke North pothole requests rose 28% following the February thaw, with 34 hotspot clusters in the Humber Summit area."},
        {"category": "flooding", "wardId": "ward-01", "period": "2025-Q2", "summary": "Flooding complaints in Rexdale correlated strongly (r=0.81) with rainfall events above 15mm."},
        {"category": "pothole", "wardId": "ward-02", "period": "2025-Q1", "summary": "Scarborough Southwest saw elevated pothole reports near Birchcliffe following road salt application in January."},
    ]
    _write_json("request_summaries.json", request_summaries)

    pipeline_run = {
        "runId": "mock-run-001",
        "engine": "pandas",
        "rowsProcessed": len(df),
        "durationSec": 0.01,
        "createdAt": f"{today.isoformat()}T00:00:00Z",
    }
    _write_json("pipeline_run.json", pipeline_run)

    print(f"\nAll 8 artifacts written to {ARTIFACTS}")
    print("  wards.json")
    print("  wards.geojson")
    print("  daily_aggregates.parquet")
    print("  forecasts.json")
    print("  hotspots.json")
    print("  risk_scores.json")
    print("  request_summaries.json")
    print("  pipeline_run.json")


def _write_json(name: str, data: object) -> None:
    path = ARTIFACTS / name
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  {name}")


if __name__ == "__main__":
    main()
