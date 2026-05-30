"""Tests for pipeline/src/ingest_weather.py — TDD red phase."""

import pytest


def test_fetch_returns_dataframe():
    """Open-Meteo API returns a DataFrame with expected columns."""
    from pipeline.src.ingest_weather import fetch_weather_history
    # Use a narrow date range to keep test fast
    df = fetch_weather_history("2025-01-01", "2025-01-07")
    assert len(df) == 7


def test_fetch_has_required_columns():
    from pipeline.src.ingest_weather import fetch_weather_history
    df = fetch_weather_history("2025-01-01", "2025-01-07")
    assert {"date", "tempC", "precipMm"}.issubset(set(df.columns))


def test_forecast_returns_7_days():
    from pipeline.src.ingest_weather import fetch_weather_forecast
    df = fetch_weather_forecast()
    assert len(df) == 7


def test_forecast_has_required_columns():
    from pipeline.src.ingest_weather import fetch_weather_forecast
    df = fetch_weather_forecast()
    assert {"date", "tempC", "precipMm"}.issubset(set(df.columns))
