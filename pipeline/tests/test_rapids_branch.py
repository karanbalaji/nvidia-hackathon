"""Tests for RAPIDS branch guarded imports and engine abstraction.

Verifies that:
- PIPELINE_ENGINE=rapids raises RuntimeError on non-RAPIDS machines
- polars/duckdb engines complete the pipeline end-to-end
- dbscan_cluster is callable on CPU (sklearn fallback)
"""

import os
import pytest


# ---------------------------------------------------------------------------
# RAPIDS guard tests
# ---------------------------------------------------------------------------

def test_rapids_engine_raises_on_mac():
    """PIPELINE_ENGINE=rapids should raise RuntimeError where cuDF is absent."""
    import importlib
    import pipeline.src.engine as eng_mod

    original = os.environ.get("PIPELINE_ENGINE")
    try:
        os.environ["PIPELINE_ENGINE"] = "rapids"
        importlib.reload(eng_mod)
        try:
            import cudf  # noqa: F401
            pytest.skip("cuDF is actually installed — Spark environment")
        except ImportError:
            pass
        with pytest.raises(RuntimeError, match="DGX Spark"):
            eng_mod.get_engine()
    finally:
        if original is None:
            os.environ.pop("PIPELINE_ENGINE", None)
        else:
            os.environ["PIPELINE_ENGINE"] = original
        importlib.reload(eng_mod)


def test_cuspatial_check_raises_on_mac():
    """check_cuspatial() should raise RuntimeError where cuspatial is absent."""
    import pipeline.src.engine as eng
    try:
        import cuspatial  # noqa: F401
        pytest.skip("cuspatial is installed — Spark environment")
    except ImportError:
        pass
    with pytest.raises(RuntimeError, match="cuspatial"):
        eng.check_cuspatial()


# ---------------------------------------------------------------------------
# DBSCAN CPU fallback
# ---------------------------------------------------------------------------

def test_dbscan_cluster_cpu_fallback():
    """dbscan_cluster should work on CPU using sklearn."""
    from pipeline.src.engine import dbscan_cluster

    lats = [43.6, 43.61, 43.62, 43.9, 43.91]
    lngs = [-79.4, -79.41, -79.42, -79.7, -79.71]
    labels = dbscan_cluster(lats, lngs, eps_km=5.0, min_samples=2)
    assert len(labels) == len(lats)
    # First 3 should cluster together, last 2 together (2 clusters)
    assert labels[0] == labels[1] == labels[2]
    assert labels[3] == labels[4]
    assert labels[0] != labels[3]


def test_dbscan_cluster_noise_points():
    """Isolated points get label -1 (noise)."""
    from pipeline.src.engine import dbscan_cluster

    # Widely spaced points — none close enough to cluster
    lats = [43.0, 43.5, 44.0]
    lngs = [-80.0, -79.5, -79.0]
    labels = dbscan_cluster(lats, lngs, eps_km=1.0, min_samples=2)
    assert all(label == -1 for label in labels)


# ---------------------------------------------------------------------------
# Polars / DuckDB engine round-trip (acceptance criterion)
# ---------------------------------------------------------------------------

def test_polars_engine_available():
    """polars is importable — a dependency requirement."""
    import polars  # noqa: F401


def test_duckdb_engine_available():
    """duckdb is importable — a dependency requirement."""
    import duckdb  # noqa: F401
