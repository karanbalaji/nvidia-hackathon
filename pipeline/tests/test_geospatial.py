"""Tests for geospatial enrichment — real ward centroids in hotspots.

TDD: these tests define the expected behaviour BEFORE implementation.
"""

import json
from pathlib import Path

import pytest


GEO_DIR = Path(__file__).parent.parent / "data" / "geo"
ARTIFACTS = Path(__file__).parent.parent / "artifacts"


# ---------------------------------------------------------------------------
# Unit tests for centroid extraction
# ---------------------------------------------------------------------------

def test_geometry_centroid_polygon():
    """A simple square polygon has the expected centroid."""
    from pipeline.src.run import _geometry_centroid
    square = {
        "type": "Polygon",
        "coordinates": [
            [
                [-79.5, 43.6],
                [-79.4, 43.6],
                [-79.4, 43.8],
                [-79.5, 43.8],
                [-79.5, 43.6],  # closing point
            ]
        ],
    }
    lat, lng = _geometry_centroid(square)
    # Centroid of a square: average of corners
    assert abs(lat - 43.7) < 0.01
    assert abs(lng - (-79.45)) < 0.01


def test_geometry_centroid_multipolygon():
    """MultiPolygon centroid is the average of all polygon centroids."""
    from pipeline.src.run import _geometry_centroid
    # Two identical squares → centroid is same as each square's centroid
    square = [
        [
            [-79.5, 43.6],
            [-79.4, 43.6],
            [-79.4, 43.8],
            [-79.5, 43.8],
            [-79.5, 43.6],
        ]
    ]
    mp = {"type": "MultiPolygon", "coordinates": [square, square]}
    lat, lng = _geometry_centroid(mp)
    assert abs(lat - 43.7) < 0.01
    assert abs(lng - (-79.45)) < 0.01


def test_geometry_centroid_empty_fallback():
    """Unknown geometry type falls back to Toronto default."""
    from pipeline.src.run import _geometry_centroid
    lat, lng = _geometry_centroid({"type": "Point", "coordinates": []})
    assert lat == 43.7
    assert lng == -79.4


# ---------------------------------------------------------------------------
# Integration: build_wards_from_geojson returns real centroids
# ---------------------------------------------------------------------------

def test_build_wards_returns_ward_meta():
    """build_wards_from_geojson should return a ward_meta dict with lat/lng."""
    if not (GEO_DIR / "wards.geojson").exists():
        pytest.skip("wards.geojson not present")
    from pipeline.src.run import build_wards_from_geojson
    wards, ward_meta = build_wards_from_geojson()
    assert len(wards) > 0
    # ward_meta should have an entry per ward
    assert len(ward_meta) == len(wards)
    # Each entry should have lat/lng keys
    for wid, meta in ward_meta.items():
        assert "lat" in meta and "lng" in meta
        assert "name" in meta


def test_ward_centroids_are_in_toronto_bounds():
    """All ward centroids should be within Toronto's bounding box."""
    if not (GEO_DIR / "wards.geojson").exists():
        pytest.skip("wards.geojson not present")
    from pipeline.src.run import build_wards_from_geojson
    _, ward_meta = build_wards_from_geojson()
    for wid, meta in ward_meta.items():
        assert 43.5 < meta["lat"] < 44.0, f"{wid} lat {meta['lat']} out of Toronto bounds"
        assert -80.0 < meta["lng"] < -79.0, f"{wid} lng {meta['lng']} out of Toronto bounds"


# ---------------------------------------------------------------------------
# Integration: hotspots artifact uses real centroids
# ---------------------------------------------------------------------------

def test_hotspots_have_real_centroids():
    """Hotspots in the artifact should NOT all be (43.7, -79.4) placeholder."""
    path = ARTIFACTS / "hotspots.json"
    if not path.exists():
        pytest.skip("hotspots.json not generated yet")
    data = json.loads(path.read_text())
    if len(data) == 0:
        pytest.skip("hotspots.json is empty")
    # After geospatial enrichment, not ALL hotspots should be 43.7 / -79.4
    all_placeholder = all(
        abs(h["centroidLat"] - 43.7) < 0.001 and abs(h["centroidLng"] - (-79.4)) < 0.001
        for h in data
    )
    assert not all_placeholder, "All hotspots still have placeholder coords — geospatial enrichment not applied"


def test_hotspots_neighbourhood_populated():
    """Hotspot neighbourhood field should be populated (ward name fallback)."""
    path = ARTIFACTS / "hotspots.json"
    if not path.exists():
        pytest.skip("hotspots.json not generated yet")
    data = json.loads(path.read_text())
    # After enrichment, neighbourhood should be set (not empty string for all)
    populated = [h for h in data if h.get("neighbourhood")]
    assert len(populated) > 0, "No hotspot has a neighbourhood value"
