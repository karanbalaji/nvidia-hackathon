"""Main pipeline orchestrator for 311 Pulse.

Steps:
  1. Ingest 311 CSVs → clean + categorise records
  2. Ingest ward boundaries → wards.json
  3. Fetch weather history + join onto daily aggregates
  4. Compute forecasts (7-day rolling-average per ward × category)
  5. Detect hotspots (top ward × category combinations by intensity)
  6. Compute risk scores (composite of trend + weather)
  7. Build request summaries
  8. Write all artifacts + pipeline_run.json

Usage:
  python -m pipeline.src.run [--sample N] [--engine pandas|polars|duckdb|rapids]
"""

import argparse
import json
import time
import uuid
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

ARTIFACTS = Path(__file__).parent.parent / "artifacts"
GEO_DIR = Path(__file__).parent.parent / "data" / "geo"


# ---------------------------------------------------------------------------
# Geospatial helpers (no shapely/geopandas required)
# ---------------------------------------------------------------------------

def _polygon_centroid(coordinates: list) -> tuple[float, float]:
    """Average of exterior ring coords → (lat, lng). GeoJSON is [lng, lat].

    GeoJSON rings close by repeating the first point — we skip it so it
    doesn't skew the centroid.
    """
    exterior = coordinates[0] if coordinates else []
    # Skip closing point if it duplicates the opening point
    pts = exterior[:-1] if len(exterior) > 1 and exterior[0] == exterior[-1] else exterior
    n = len(pts)
    if n == 0:
        return (43.7, -79.4)
    avg_lng = sum(p[0] for p in pts) / n
    avg_lat = sum(p[1] for p in pts) / n
    return (round(avg_lat, 6), round(avg_lng, 6))


def _geometry_centroid(geometry: dict) -> tuple[float, float]:
    """Compute approximate centroid from a GeoJSON geometry object."""
    gtype = geometry.get("type", "")
    coords = geometry.get("coordinates", [])
    if gtype == "Polygon":
        return _polygon_centroid(coords)
    if gtype == "MultiPolygon":
        # Average centroid of all constituent polygons
        centroids = [_polygon_centroid(poly) for poly in coords]
        if not centroids:
            return (43.7, -79.4)
        avg_lat = sum(c[0] for c in centroids) / len(centroids)
        avg_lng = sum(c[1] for c in centroids) / len(centroids)
        return (round(avg_lat, 6), round(avg_lng, 6))
    return (43.7, -79.4)


# ---------------------------------------------------------------------------
# Ward helpers
# ---------------------------------------------------------------------------

def build_wards_from_geojson() -> tuple[list[dict], dict[str, dict]]:
    """Read City Wards GeoJSON; return (Ward[], ward_meta).

    ward_meta maps wardId → {"lat": float, "lng": float, "name": str}.
    """
    geojson_path = GEO_DIR / "wards.geojson"
    if not geojson_path.exists():
        raise FileNotFoundError(f"Ward GeoJSON not found: {geojson_path}")

    with open(geojson_path) as f:
        gj = json.load(f)

    wards: list[dict] = []
    ward_meta: dict[str, dict] = {}

    for feature in gj.get("features", []):
        props = feature.get("properties", {})
        ward_num = props.get("AREA_SHORT_CODE") or props.get("WARD_NUM") or props.get("AREA_ID")
        ward_name = props.get("AREA_NAME") or props.get("WARD_NAME") or props.get("NAME") or f"Ward {ward_num}"
        if ward_num is None:
            continue
        ward_id = f"ward-{int(ward_num):02d}"
        lat, lng = _geometry_centroid(feature.get("geometry") or {})
        wards.append({
            "wardId": ward_id,
            "wardName": str(ward_name),
            "neighbourhoods": [],
        })
        ward_meta[ward_id] = {"lat": lat, "lng": lng, "name": str(ward_name)}

    wards.sort(key=lambda w: w["wardId"])
    return wards, ward_meta


# ---------------------------------------------------------------------------
# Analytics transforms
# ---------------------------------------------------------------------------

def join_weather(agg: pd.DataFrame, weather: pd.DataFrame) -> pd.DataFrame:
    """Left-join daily aggregates with weather on 'date'."""
    weather = weather.rename(columns={"date": "date"})
    merged = agg.merge(weather, on="date", how="left")
    merged["tempC"] = merged["tempC"].fillna(0.0)
    merged["precipMm"] = merged["precipMm"].fillna(0.0)
    return merged


def compute_forecasts(agg: pd.DataFrame, weather_forecast: pd.DataFrame) -> list[dict]:
    """7-day rolling-average forecast per ward × category."""
    from datetime import date, timedelta
    agg["date"] = pd.to_datetime(agg["date"])
    data_max = agg["date"].max()
    # Anchor forecast horizon to TODAY so the window is always "next 7 days",
    # even when the training data doesn't extend to the current date.
    today = date.today()
    horizon_start = today.isoformat()
    horizon_end = (today + timedelta(days=7)).isoformat()

    # Use last 30 days of history to compute moving average
    cutoff = data_max - pd.Timedelta(days=30)
    recent = agg[agg["date"] >= cutoff]

    # Average daily count per (wardId, category) over last 30d → × 7 for horizon
    base = (
        recent.groupby(["wardId", "category"])["count"]
        .mean()
        .reset_index()
        .rename(columns={"count": "avgDaily"})
    )

    # Apply weather multiplier: +10% per 10mm rain for flooding/pothole
    avg_precip = weather_forecast["precipMm"].mean() if len(weather_forecast) > 0 else 0.0

    forecasts = []
    for _, row in base.iterrows():
        predicted = row["avgDaily"] * 7
        multiplier = 1.0
        if row["category"] in ("flooding", "pothole") and avg_precip > 5:
            multiplier = 1.0 + (avg_precip / 100.0)
        predicted_adj = round(predicted * multiplier)
        forecasts.append({
            "wardId": row["wardId"],
            "category": row["category"],
            "horizonStart": horizon_start,
            "horizonEnd": horizon_end,
            "predictedCount": max(1, predicted_adj),
            "confidenceLow": max(0, round(predicted_adj * 0.8)),
            "confidenceHigh": round(predicted_adj * 1.25),
            "method": "movingavg",
        })

    # Sort by predictedCount descending
    forecasts.sort(key=lambda x: -x["predictedCount"])
    return forecasts


def compute_hotspots(
    agg: pd.DataFrame,
    ward_meta: dict[str, dict] | None = None,
) -> list[dict]:
    """Top ward × category combinations by 30-day volume with real centroids."""
    agg["date"] = pd.to_datetime(agg["date"])
    data_max = agg["date"].max()
    cutoff = data_max - pd.Timedelta(days=30)
    recent = agg[agg["date"] >= cutoff]

    totals = (
        recent.groupby(["wardId", "category"])["count"]
        .sum()
        .reset_index()
        .rename(columns={"count": "total30d"})
    )
    overall_max = totals["total30d"].max() if len(totals) > 0 else 1

    top = totals.nlargest(50, "total30d")
    meta = ward_meta or {}

    hotspots = []
    for _, row in top.iterrows():
        wid = row["wardId"]
        winfo = meta.get(wid, {})
        lat = winfo.get("lat", 43.7)
        lng = winfo.get("lng", -79.4)
        name = winfo.get("name", "")
        intensity = round(float(row["total30d"]) / float(overall_max), 3)
        hotspots.append({
            "category": row["category"],
            "wardId": wid,
            "neighbourhood": name,
            "centroidLat": lat,
            "centroidLng": lng,
            "intensity": intensity,
            "count": int(row["total30d"]),
        })
    return hotspots


def compute_risk_scores(agg: pd.DataFrame, weather_forecast: pd.DataFrame) -> list[dict]:
    """Composite 0–100 risk score per ward × category."""
    agg["date"] = pd.to_datetime(agg["date"])
    data_max = agg["date"].max()
    today_str = data_max.date().isoformat()

    # 14-day trend: compare last 7d avg vs prior 7d avg
    cutoff_7 = data_max - pd.Timedelta(days=7)
    cutoff_14 = data_max - pd.Timedelta(days=14)

    recent7 = agg[agg["date"] >= cutoff_7].groupby(["wardId", "category"])["count"].mean().reset_index().rename(columns={"count": "avg7"})
    prior7 = agg[(agg["date"] >= cutoff_14) & (agg["date"] < cutoff_7)].groupby(["wardId", "category"])["count"].mean().reset_index().rename(columns={"count": "avgPrior7"})

    merged = recent7.merge(prior7, on=["wardId", "category"], how="left").fillna(0)
    merged["trend"] = (merged["avg7"] - merged["avgPrior7"]) / (merged["avgPrior7"] + 0.01)

    # Overall volume baseline
    vol = agg.groupby(["wardId", "category"])["count"].mean().reset_index().rename(columns={"count": "avgVol"})
    vol_max = vol["avgVol"].max() if len(vol) > 0 else 1
    vol["volScore"] = (vol["avgVol"] / vol_max * 60).clip(0, 60)

    merged = merged.merge(vol[["wardId", "category", "volScore"]], on=["wardId", "category"], how="left").fillna(0)

    avg_precip = weather_forecast["precipMm"].mean() if len(weather_forecast) > 0 else 0.0
    rain_boost = min(20, avg_precip * 1.5)

    scores = []
    for _, row in merged.iterrows():
        trend_score = min(20, max(0, row["trend"] * 40))
        base = row["volScore"] + trend_score
        drivers = []
        if row["trend"] > 0.1:
            drivers.append("rising 14-day trend")
        if avg_precip > 5 and row["category"] in ("flooding", "pothole"):
            base += rain_boost
            drivers.append("heavy rain forecast")
        if row["volScore"] > 40:
            drivers.append("above-baseline request volume")
        if not drivers:
            drivers.append("stable trend")

        score = round(min(100, max(1, base)))
        scores.append({
            "wardId": row["wardId"],
            "category": row["category"],
            "score": score,
            "drivers": drivers,
            "asOf": today_str,
        })

    scores.sort(key=lambda x: -x["score"])
    return scores


def build_summaries(agg: pd.DataFrame) -> list[dict]:
    """Template-based request summaries per ward × category × quarter."""
    agg["date"] = pd.to_datetime(agg["date"])
    agg["quarter"] = agg["date"].dt.to_period("Q").astype(str)

    quarterly = (
        agg.groupby(["wardId", "category", "quarter"])["count"]
        .sum()
        .reset_index()
        .rename(columns={"count": "total"})
    )

    # Keep top 2 quarters per ward × category
    top = quarterly.sort_values("total", ascending=False).groupby(["wardId", "category"]).head(2)

    summaries = []
    for _, row in top.iterrows():
        summaries.append({
            "category": row["category"],
            "wardId": row["wardId"],
            "period": row["quarter"],
            "summary": (
                f"{row['wardId']} received {int(row['total'])} {row['category']} "
                f"requests in {row['quarter']}."
            ),
        })
    return summaries


# ---------------------------------------------------------------------------
# Main entrypoint
# ---------------------------------------------------------------------------

def run(sample: int = 0, engine: str = "pandas") -> None:
    import os
    os.environ["PIPELINE_ENGINE"] = engine

    ARTIFACTS.mkdir(exist_ok=True)
    start = time.time()

    print("▶ Step 1/7  Loading 311 CSVs …")
    from pipeline.src.ingest_311 import load_all_csvs, aggregate_daily
    raw = load_all_csvs(sample=sample)
    print(f"   {len(raw):,} clean records loaded")

    print("▶ Step 2/7  Aggregating daily counts …")
    agg = aggregate_daily(raw)
    print(f"   {len(agg):,} aggregate rows")

    print("▶ Step 3/7  Loading ward boundaries …")
    wards, ward_meta = build_wards_from_geojson()
    print(f"   {len(wards)} wards with real centroids")
    (ARTIFACTS / "wards.json").write_text(json.dumps(wards, indent=2))

    print("▶ Step 4/7  Fetching weather …")
    from pipeline.src.ingest_weather import fetch_weather_history, fetch_weather_forecast
    agg_dates = sorted(agg["date"].unique())
    if agg_dates:
        wx = fetch_weather_history(str(agg_dates[0]), str(agg_dates[-1]))
        agg_wx = join_weather(agg, wx)
    else:
        agg_wx = agg
        agg_wx["tempC"] = 0.0
        agg_wx["precipMm"] = 0.0
    wx_forecast = fetch_weather_forecast(days=7)
    print(f"   Weather history: {len(agg_wx)} rows | forecast: {len(wx_forecast)} days")

    print("▶ Step 5/7  Writing daily_aggregates.parquet …")
    agg_wx.to_parquet(ARTIFACTS / "daily_aggregates.parquet", index=False)

    print("▶ Step 6/7  Computing forecasts, hotspots, risk scores …")
    forecasts = compute_forecasts(agg, wx_forecast)
    hotspots = compute_hotspots(agg, ward_meta)
    risk_scores = compute_risk_scores(agg, wx_forecast)
    summaries = build_summaries(agg)

    (ARTIFACTS / "forecasts.json").write_text(json.dumps(forecasts, indent=2))
    (ARTIFACTS / "hotspots.json").write_text(json.dumps(hotspots, indent=2))
    (ARTIFACTS / "risk_scores.json").write_text(json.dumps(risk_scores, indent=2))
    (ARTIFACTS / "request_summaries.json").write_text(json.dumps(summaries, indent=2))

    print("▶ Step 7/7  Writing pipeline_run.json …")
    duration = round(time.time() - start, 2)
    pipeline_run = {
        "runId": str(uuid.uuid4()),
        "engine": engine,
        "rowsProcessed": len(raw),
        "durationSec": duration,
        "createdAt": date.today().isoformat(),
        "sampleSize": sample if sample > 0 else len(raw),
    }
    (ARTIFACTS / "pipeline_run.json").write_text(json.dumps(pipeline_run, indent=2))

    print(f"\n✓ Pipeline complete in {duration}s — {len(raw):,} rows, engine={engine}")
    print(f"  Artifacts: {', '.join(f.name for f in sorted(ARTIFACTS.glob('*')))}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the 311 Pulse pipeline")
    parser.add_argument("--sample", type=int, default=0, help="Limit to first N rows (0 = all)")
    parser.add_argument("--engine", default="pandas", choices=["pandas", "polars", "duckdb", "rapids"])
    args = parser.parse_args()
    run(sample=args.sample, engine=args.engine)
