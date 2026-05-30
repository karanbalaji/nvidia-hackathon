"""Write schema-valid mock artifacts to pipeline/artifacts/.

Produces the minimum data needed for Phase 0/1 downstream work:
3 wards, 2 categories (pothole, flooding), 30 days of aggregates.

Run with:  python -m pipeline.src.mock
"""

import json
import os
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

ARTIFACTS = Path(__file__).parent.parent / "artifacts"


def main() -> None:
    ARTIFACTS.mkdir(exist_ok=True)

    wards = [
        {"wardId": "ward-01", "wardName": "Etobicoke North", "neighbourhoods": ["Humber Summit", "Rexdale"]},
        {"wardId": "ward-02", "wardName": "Scarborough Southwest", "neighbourhoods": ["Birchcliffe", "Cliffside"]},
        {"wardId": "ward-03", "wardName": "Toronto Centre", "neighbourhoods": ["Regent Park", "Cabbagetown"]},
    ]
    _write_json("wards.json", wards)

    # daily_aggregates.parquet — 30 days × 3 wards × 2 categories
    today = date.today()
    rows = []
    base_counts = {
        ("ward-01", "pothole"): 6, ("ward-01", "flooding"): 2,
        ("ward-02", "pothole"): 5, ("ward-02", "flooding"): 1,
        ("ward-03", "pothole"): 3, ("ward-03", "flooding"): 1,
    }
    for i in range(30):
        d = (today - timedelta(days=29 - i)).isoformat()
        for (ward_id, cat), base in base_counts.items():
            rows.append({
                "date": d,
                "wardId": ward_id,
                "category": cat,
                "count": base + (i % 3),
                "tempC": 10.0 + i * 0.3,
                "precipMm": 5.0 if i % 7 == 0 else 0.0,
            })
    df = pd.DataFrame(rows)
    df.to_parquet(ARTIFACTS / "daily_aggregates.parquet", index=False)
    print(f"  daily_aggregates.parquet: {len(df)} rows")

    horizon_start = (today + timedelta(days=1)).isoformat()
    horizon_end = (today + timedelta(days=7)).isoformat()
    forecasts = [
        {"wardId": "ward-01", "category": "pothole", "horizonStart": horizon_start, "horizonEnd": horizon_end, "predictedCount": 42, "confidenceLow": 35, "confidenceHigh": 50, "method": "movingavg"},
        {"wardId": "ward-02", "category": "pothole", "horizonStart": horizon_start, "horizonEnd": horizon_end, "predictedCount": 38, "confidenceLow": 30, "confidenceHigh": 46, "method": "movingavg"},
        {"wardId": "ward-03", "category": "pothole", "horizonStart": horizon_start, "horizonEnd": horizon_end, "predictedCount": 19, "confidenceLow": 14, "confidenceHigh": 25, "method": "movingavg"},
        {"wardId": "ward-01", "category": "flooding", "horizonStart": horizon_start, "horizonEnd": horizon_end, "predictedCount": 11, "confidenceLow": 7, "confidenceHigh": 16, "method": "movingavg"},
        {"wardId": "ward-02", "category": "flooding", "horizonStart": horizon_start, "horizonEnd": horizon_end, "predictedCount": 8, "confidenceLow": 5, "confidenceHigh": 12, "method": "movingavg"},
    ]
    _write_json("forecasts.json", forecasts)

    hotspots = [
        {"category": "pothole", "wardId": "ward-01", "neighbourhood": "Humber Summit", "centroidLat": 43.74, "centroidLng": -79.59, "intensity": 0.88, "count": 34},
        {"category": "pothole", "wardId": "ward-02", "neighbourhood": "Birchcliffe", "centroidLat": 43.69, "centroidLng": -79.26, "intensity": 0.72, "count": 28},
        {"category": "flooding", "wardId": "ward-01", "neighbourhood": "Rexdale", "centroidLat": 43.73, "centroidLng": -79.58, "intensity": 0.61, "count": 15},
    ]
    _write_json("hotspots.json", hotspots)

    risk_scores = [
        {"wardId": "ward-01", "category": "pothole", "score": 82, "drivers": ["rising 14-day trend", "heavy rain forecast"], "asOf": today.isoformat()},
        {"wardId": "ward-02", "category": "pothole", "score": 74, "drivers": ["above-baseline request volume"], "asOf": today.isoformat()},
        {"wardId": "ward-01", "category": "flooding", "score": 68, "drivers": ["heavy rain forecast", "low-lying area"], "asOf": today.isoformat()},
        {"wardId": "ward-03", "category": "pothole", "score": 45, "drivers": ["stable trend"], "asOf": today.isoformat()},
    ]
    _write_json("risk_scores.json", risk_scores)

    request_summaries = [
        {"category": "pothole", "wardId": "ward-01", "period": "2025-Q1", "summary": "Etobicoke North pothole requests rose 28% following the February thaw, with 34 hotspot clusters in the Humber Summit area."},
        {"category": "flooding", "wardId": "ward-01", "period": "2025-Q2", "summary": "Flooding complaints in Rexdale correlated strongly (r=0.81) with rainfall events above 15mm."},
        {"category": "pothole", "wardId": "ward-02", "period": "2025-Q1", "summary": "Scarborough Southwest saw elevated pothole reports near Birchcliffe following road salt application in January."},
    ]
    _write_json("request_summaries.json", request_summaries)

    pipeline_run = {
        "runId": "mock-run-001",
        "engine": "mock",
        "rowsProcessed": len(df),
        "durationSec": 0.01,
        "createdAt": f"{today.isoformat()}T00:00:00Z",
    }
    _write_json("pipeline_run.json", pipeline_run)

    print(f"\nAll 7 artifacts written to {ARTIFACTS}")
    print("  wards.json")
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
