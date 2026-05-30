"""Tests for the full pipeline run.py orchestration — TDD red phase."""

import json
from pathlib import Path

import pandas as pd
import pytest


ARTIFACTS = Path(__file__).parent.parent / "artifacts"


def test_artifacts_all_exist_after_run():
    """All 7 artifact files must exist after pipeline run."""
    required = [
        "wards.json",
        "daily_aggregates.parquet",
        "forecasts.json",
        "hotspots.json",
        "risk_scores.json",
        "request_summaries.json",
        "pipeline_run.json",
    ]
    for fname in required:
        assert (ARTIFACTS / fname).exists(), f"Missing artifact: {fname}"


def test_daily_aggregates_has_real_data():
    path = ARTIFACTS / "daily_aggregates.parquet"
    if not path.exists():
        pytest.skip("pipeline not yet run")
    df = pd.read_parquet(path)
    assert len(df) > 1000, "Expected real data (>1000 rows)"
    assert set(df.columns) >= {"date", "wardId", "category", "count"}


def test_wards_json_has_25_wards():
    path = ARTIFACTS / "wards.json"
    if not path.exists():
        pytest.skip("pipeline not yet run")
    data = json.loads(path.read_text())
    assert len(data) == 25, f"Expected 25 wards, got {len(data)}"


def test_forecasts_json_covers_all_categories():
    path = ARTIFACTS / "forecasts.json"
    if not path.exists():
        pytest.skip("pipeline not yet run")
    data = json.loads(path.read_text())
    cats = {r["category"] for r in data}
    expected = {"pothole", "garbage", "flooding", "graffiti", "tree", "noise"}
    assert expected.issubset(cats), f"Missing categories: {expected - cats}"


def test_pipeline_run_json_has_benchmark():
    path = ARTIFACTS / "pipeline_run.json"
    if not path.exists():
        pytest.skip("pipeline not yet run")
    data = json.loads(path.read_text())
    assert data["rowsProcessed"] > 0
    assert data["durationSec"] > 0
    assert data["engine"] in ("pandas", "polars", "duckdb", "rapids")
