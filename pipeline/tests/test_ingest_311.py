"""Tests for pipeline/src/ingest_311.py — TDD red phase."""

import io
import textwrap
import pytest
import pandas as pd


SAMPLE_CSV = textwrap.dedent("""\
    Creation Date,Status,First 3 Chars of Postal Code,Intersection Street 1,Intersection Street 2,Ward,Service Request Type,Division,Section
    2025-01-01 00:01:05.0000000,Completed,M8Y,Lakeshore Blvd W,,Etobicoke-Lakeshore (03),Road Pothole / Road Damage,Transportation Services,Road Operations
    2025-01-02 10:00:00.0000000,Closed,M5V,King St,,Spadina-Fort York (10),Res / Garbage / Not Picked Up,Solid Waste Management Services,Collection Operations
    2025-01-03 08:30:00.0000000,In Progress,M9A,,,"Etobicoke-Lakeshore (03)",Catch Basin - Blocked / Flooding,Toronto Water,Water Infrastructure
    2025-02-01 00:00:00.0000000,Completed,M1K,,,Scarborough Bluffs (24),Graffiti Removal,Municipal Licensing & Standards,Bylaw Enforcement
    2025-03-15 12:00:00.0000000,Closed,,,,,"Unknown Type XYZ",Division A,Section B
""")


def test_parse_returns_dataframe():
    from pipeline.src.ingest_311 import parse_311_csv
    df = parse_311_csv(io.StringIO(SAMPLE_CSV))
    # Last row has empty ward → dropped, so 4 valid rows remain
    assert len(df) == 4


def test_parse_adds_category_column():
    from pipeline.src.ingest_311 import parse_311_csv
    df = parse_311_csv(io.StringIO(SAMPLE_CSV))
    assert "category" in df.columns


def test_category_assigned_correctly():
    from pipeline.src.ingest_311 import parse_311_csv
    df = parse_311_csv(io.StringIO(SAMPLE_CSV))
    row = df[df["Service Request Type"] == "Road Pothole / Road Damage"].iloc[0]
    assert row["category"] == "pothole"


def test_parse_extracts_ward_id():
    from pipeline.src.ingest_311 import parse_311_csv
    df = parse_311_csv(io.StringIO(SAMPLE_CSV))
    assert "wardId" in df.columns
    # "Etobicoke-Lakeshore (03)" → "ward-03"
    row = df[df["Service Request Type"] == "Road Pothole / Road Damage"].iloc[0]
    assert row["wardId"] == "ward-03"


def test_parse_extracts_date():
    from pipeline.src.ingest_311 import parse_311_csv
    df = parse_311_csv(io.StringIO(SAMPLE_CSV))
    assert "date" in df.columns
    row = df.iloc[0]
    assert str(row["date"]) == "2025-01-01"


def test_rows_missing_ward_are_dropped():
    from pipeline.src.ingest_311 import parse_311_csv
    df = parse_311_csv(io.StringIO(SAMPLE_CSV))
    # Last row has empty ward — should be dropped
    assert all(df["wardId"].notna())
    assert all(df["wardId"] != "")


def test_aggregate_daily_produces_correct_shape():
    from pipeline.src.ingest_311 import parse_311_csv, aggregate_daily
    df = parse_311_csv(io.StringIO(SAMPLE_CSV))
    agg = aggregate_daily(df)
    assert set(agg.columns) >= {"date", "wardId", "category", "count"}
    assert len(agg) > 0


def test_aggregate_daily_counts_are_positive():
    from pipeline.src.ingest_311 import parse_311_csv, aggregate_daily
    df = parse_311_csv(io.StringIO(SAMPLE_CSV))
    agg = aggregate_daily(df)
    assert (agg["count"] > 0).all()
