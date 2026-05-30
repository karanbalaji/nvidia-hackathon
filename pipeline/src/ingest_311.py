"""Ingest and parse Toronto 311 Service Request CSVs.

Reads raw SR CSV files (one per year) from pipeline/data/raw/,
parses dates, extracts ward IDs, assigns canonical categories,
and produces a clean daily-aggregate DataFrame.
"""

import re
from io import StringIO
from pathlib import Path
from typing import Union

import pandas as pd

from pipeline.src.categories import normalize_category

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"

_WARD_NUM_RE = re.compile(r"\((\d+)\)")


def _extract_ward_id(ward_str: str) -> str:
    """Parse 'Etobicoke-Lakeshore (03)' → 'ward-03'."""
    if not ward_str or not isinstance(ward_str, str):
        return ""
    m = _WARD_NUM_RE.search(ward_str)
    if not m:
        return ""
    num = int(m.group(1))
    return f"ward-{num:02d}"


def parse_311_df(df: pd.DataFrame) -> pd.DataFrame:
    """Transform a raw 311 pandas DataFrame (already loaded from CSV).

    Adds columns: date (date), wardId (str), category (str).
    Drops rows with no ward or date.
    """
    df = df.copy()
    df["date"] = pd.to_datetime(df["Creation Date"], errors="coerce").dt.date
    df["wardId"] = df["Ward"].fillna("").apply(_extract_ward_id)
    df = df[df["wardId"] != ""].copy()
    df = df[df["date"].notna()].copy()
    df["category"] = df["Service Request Type"].fillna("").apply(normalize_category)
    return df


def parse_311_csv(source: Union[str, Path, StringIO]) -> pd.DataFrame:
    """Parse a 311 CSV file/stream and return a clean DataFrame."""
    if isinstance(source, StringIO):
        raw = pd.read_csv(source, on_bad_lines="skip")
    else:
        raw = pd.read_csv(source, encoding="latin-1", on_bad_lines="skip")
    return parse_311_df(raw)


def aggregate_daily(df: pd.DataFrame) -> pd.DataFrame:
    """Group cleaned SR DataFrame by date × wardId × category → count."""
    agg = (
        df.groupby(["date", "wardId", "category"])
        .size()
        .reset_index(name="count")
    )
    agg["date"] = agg["date"].astype(str)
    return agg


def _read_csv_with_engine(path: Path) -> pd.DataFrame:
    """Read a 311 CSV using the active engine; always returns a pandas DataFrame."""
    from pipeline.src.engine import get_engine
    engine = get_engine()

    if engine == "polars":
        try:
            import polars as pl
            return pl.read_csv(str(path), encoding="latin1", ignore_errors=True).to_pandas()
        except Exception:
            return pd.read_csv(path, encoding="latin-1", on_bad_lines="skip")

    if engine == "duckdb":
        import duckdb
        try:
            return duckdb.sql(
                f"SELECT * FROM read_csv_auto('{path}', ignore_errors=true)"
            ).df()
        except Exception:
            return pd.read_csv(path, encoding="latin-1", on_bad_lines="skip")

    if engine == "rapids":
        try:
            import cudf
            return cudf.read_csv(str(path), encoding="latin-1").to_pandas()
        except Exception:
            return pd.read_csv(path, encoding="latin-1", on_bad_lines="skip")

    # pandas (default)
    return pd.read_csv(path, encoding="latin-1", on_bad_lines="skip")


def load_all_csvs(sample: int = 0) -> pd.DataFrame:
    """Load all SR CSV files from pipeline/data/raw/, return combined clean DataFrame.

    Uses the active PIPELINE_ENGINE for CSV reading (polars/duckdb for speed on bulk runs).
    Args:
        sample: If > 0, return only the first N rows (for fast Mac dev runs).
    """
    csv_files = sorted(RAW_DIR.glob("SR*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No SR*.csv files found in {RAW_DIR}")

    frames = []
    for f in csv_files:
        raw_df = _read_csv_with_engine(f)
        frames.append(parse_311_df(raw_df))

    combined = pd.concat(frames, ignore_index=True)
    if sample > 0:
        combined = combined.head(sample)
    return combined
