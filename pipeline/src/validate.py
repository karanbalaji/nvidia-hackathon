"""Validate all pipeline artifacts against their schemas.

Run with:  python -m pipeline.src.validate
"""

import json
import sys
from pathlib import Path

import pandas as pd

ARTIFACTS = Path(__file__).parent.parent / "artifacts"

REQUIRED_FILES = [
    "wards.json",
    "daily_aggregates.parquet",
    "forecasts.json",
    "hotspots.json",
    "risk_scores.json",
    "request_summaries.json",
    "pipeline_run.json",
]

SCHEMAS = {
    "wards.json": {"wardId", "wardName", "neighbourhoods"},
    "forecasts.json": {"wardId", "category", "horizonStart", "horizonEnd", "predictedCount", "confidenceLow", "confidenceHigh", "method"},
    "hotspots.json": {"category", "wardId", "centroidLat", "centroidLng", "intensity", "count"},
    "risk_scores.json": {"wardId", "category", "score", "drivers", "asOf"},
    "request_summaries.json": {"category", "wardId", "period", "summary"},
    "pipeline_run.json": {"runId", "engine", "rowsProcessed", "durationSec", "createdAt"},
}


def main() -> None:
    errors: list[str] = []

    for fname in REQUIRED_FILES:
        path = ARTIFACTS / fname
        if not path.exists():
            errors.append(f"MISSING: {fname}")
            continue

        try:
            if fname.endswith(".parquet"):
                df = pd.read_parquet(path)
                required = {"date", "wardId", "category", "count"}
                missing = required - set(df.columns)
                if missing:
                    errors.append(f"{fname}: missing columns {missing}")
                elif len(df) == 0:
                    errors.append(f"{fname}: empty DataFrame")
                else:
                    print(f"  OK  {fname} ({len(df)} rows)")
            else:
                with open(path) as f:
                    data = json.load(f)
                if isinstance(data, list):
                    if len(data) == 0:
                        errors.append(f"{fname}: empty array")
                        continue
                    required = SCHEMAS.get(fname, set())
                    missing = required - set(data[0].keys())
                    if missing:
                        errors.append(f"{fname}: missing keys {missing}")
                    else:
                        print(f"  OK  {fname} ({len(data)} records)")
                else:
                    required = SCHEMAS.get(fname, set())
                    missing = required - set(data.keys())
                    if missing:
                        errors.append(f"{fname}: missing keys {missing}")
                    else:
                        print(f"  OK  {fname} (object)")
        except Exception as e:
            errors.append(f"{fname}: ERROR {e}")

    if errors:
        print("\nVALIDATION FAILED:")
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)
    else:
        print("\nAll artifacts valid.")


if __name__ == "__main__":
    main()
