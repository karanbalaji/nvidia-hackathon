"""Fetch historical and forecast weather data for Toronto via Open-Meteo.

No API key required. Toronto coordinates: lat=43.7001, lng=-79.4163
Uses the daily aggregates endpoint: temperature_2m_mean + precipitation_sum.
"""

from datetime import date, timedelta

import pandas as pd
import requests

TORONTO_LAT = 43.7001
TORONTO_LNG = -79.4163

_HISTORICAL_URL = "https://archive-api.open-meteo.com/v1/archive"
_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
_DAILY_VARS = "temperature_2m_mean,precipitation_sum"


def fetch_weather_history(start_date: str, end_date: str) -> pd.DataFrame:
    """Fetch daily historical weather (temperature + precipitation) for Toronto.

    Args:
        start_date: ISO date string e.g. "2023-01-01"
        end_date:   ISO date string e.g. "2025-12-31"

    Returns:
        DataFrame with columns: date (str), tempC (float), precipMm (float)
    """
    params = {
        "latitude": TORONTO_LAT,
        "longitude": TORONTO_LNG,
        "start_date": start_date,
        "end_date": end_date,
        "daily": _DAILY_VARS,
        "timezone": "America/Toronto",
    }
    resp = requests.get(_HISTORICAL_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    daily = data["daily"]
    df = pd.DataFrame(
        {
            "date": daily["time"],
            "tempC": daily["temperature_2m_mean"],
            "precipMm": daily["precipitation_sum"],
        }
    )
    # Fill NaN precipitation with 0
    df["precipMm"] = df["precipMm"].fillna(0.0)
    df["tempC"] = df["tempC"].ffill().fillna(0.0)
    return df


def fetch_weather_forecast(days: int = 7) -> pd.DataFrame:
    """Fetch the next N-day weather forecast for Toronto.

    Returns:
        DataFrame with columns: date (str), tempC (float), precipMm (float)
    """
    today = date.today()
    end = today + timedelta(days=days - 1)

    params = {
        "latitude": TORONTO_LAT,
        "longitude": TORONTO_LNG,
        "daily": _DAILY_VARS,
        "start_date": today.isoformat(),
        "end_date": end.isoformat(),
        "timezone": "America/Toronto",
    }
    resp = requests.get(_FORECAST_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    daily = data["daily"]
    df = pd.DataFrame(
        {
            "date": daily["time"],
            "tempC": daily["temperature_2m_mean"],
            "precipMm": daily["precipitation_sum"],
        }
    )
    df["precipMm"] = df["precipMm"].fillna(0.0)
    df["tempC"] = df["tempC"].fillna(0.0)
    return df
