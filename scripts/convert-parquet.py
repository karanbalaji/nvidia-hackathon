"""
Convert pipeline/artifacts/daily_aggregates.parquet → daily_aggregates.json
Run before `npm run import` to enable daily aggregate data in Convex.
"""
import json
import math
import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("ERROR: pandas not installed. Run: pip install pandas pyarrow")
    sys.exit(1)

artifacts = Path(__file__).parent.parent / "pipeline" / "artifacts"
parquet_path = artifacts / "daily_aggregates.parquet"
json_path = artifacts / "daily_aggregates.json"

if not parquet_path.exists():
    print(f"ERROR: {parquet_path} not found. Run the pipeline first.")
    sys.exit(1)

df = pd.read_parquet(parquet_path)
print(f"Read {len(df):,} rows from {parquet_path.name}")

def clean(v):
    if v is None:
        return None
    try:
        if math.isnan(float(v)):
            return None
    except (TypeError, ValueError):
        pass
    return v

records = [
    {
        "date": str(row["date"])[:10],
        "wardId": str(row["wardId"]),
        "category": str(row["category"]),
        "count": int(row["count"]),
        "tempC": clean(row.get("tempC")),
        "precipMm": clean(row.get("precipMm")),
    }
    for _, row in df.iterrows()
]

json_path.write_text(json.dumps(records))
print(f"Wrote {len(records):,} records to {json_path.name}")
