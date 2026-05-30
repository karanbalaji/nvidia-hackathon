"""Engine-agnostic data processing abstraction.

Set PIPELINE_ENGINE=pandas|polars|duckdb|rapids.
RAPIDS is only available on the DGX Spark — importing on Mac raises RuntimeError.
"""

import math
import os
from typing import Any

ENGINE = os.getenv("PIPELINE_ENGINE", "pandas")


def get_engine() -> str:
    if ENGINE == "rapids":
        try:
            import cudf  # noqa: F401
        except ImportError:
            raise RuntimeError(
                "PIPELINE_ENGINE=rapids but cuDF is not installed. "
                "Run this on the DGX Spark with RAPIDS extras: "
                "uv pip install -e '.[rapids]'"
            )
    return ENGINE


def check_cuspatial() -> None:
    """Raise RuntimeError if cuspatial is not available (i.e., not on DGX Spark)."""
    try:
        import cuspatial  # noqa: F401
    except ImportError:
        raise RuntimeError(
            "cuspatial is not installed. "
            "Run point-in-polygon on the DGX Spark: uv pip install -e '.[rapids]'"
        )


def dbscan_cluster(
    lats: list[float],
    lngs: list[float],
    eps_km: float = 1.0,
    min_samples: int = 5,
) -> list[int]:
    """Cluster lat/lng points with DBSCAN.

    Uses cuML on RAPIDS (GPU) or sklearn on CPU. Returns cluster labels list
    (length == len(lats)); noise points get label -1.
    """
    if len(lats) == 0:
        return []

    engine = get_engine()

    if engine == "rapids":
        try:
            import cuml
            import numpy as np
            coords = np.column_stack([lats, lngs])
            # eps in degrees ≈ km / 111
            clf = cuml.DBSCAN(eps=eps_km / 111.0, min_samples=min_samples)
            labels = clf.fit_predict(coords)
            return labels.tolist()
        except ImportError:
            pass  # fall through to sklearn

    # CPU path (sklearn or pure-Python fallback)
    try:
        from sklearn.cluster import DBSCAN
        import numpy as np
        coords = np.column_stack([lats, lngs])
        clf = DBSCAN(eps=eps_km / 111.0, min_samples=min_samples, metric="euclidean")
        return clf.fit_predict(coords).tolist()
    except ImportError:
        pass

    # Minimal pure-Python DBSCAN fallback (no external deps needed)
    return _pure_python_dbscan(lats, lngs, eps_km, min_samples)


def _pure_python_dbscan(
    lats: list[float],
    lngs: list[float],
    eps_km: float,
    min_samples: int,
) -> list[int]:
    """Minimal DBSCAN implementation in pure Python (no sklearn required)."""
    n = len(lats)
    eps_deg = eps_km / 111.0
    labels = [-1] * n
    cluster_id = 0

    def neighbors(idx: int) -> list[int]:
        result = []
        for j in range(n):
            dlat = lats[idx] - lats[j]
            dlng = lngs[idx] - lngs[j]
            if math.sqrt(dlat * dlat + dlng * dlng) <= eps_deg:
                result.append(j)
        return result

    visited = [False] * n
    for i in range(n):
        if visited[i]:
            continue
        visited[i] = True
        nbrs = neighbors(i)
        if len(nbrs) < min_samples:
            continue  # noise
        labels[i] = cluster_id
        seed = list(nbrs)
        k = 0
        while k < len(seed):
            q = seed[k]
            k += 1
            if not visited[q]:
                visited[q] = True
                q_nbrs = neighbors(q)
                if len(q_nbrs) >= min_samples:
                    seed.extend(q_nbrs)
            if labels[q] == -1:
                labels[q] = cluster_id
        cluster_id += 1

    return labels


def read_csv(path: str, **kwargs: Any):
    engine = get_engine()
    if engine == "pandas":
        import pandas as pd
        return pd.read_csv(path, **kwargs)
    elif engine == "polars":
        import polars as pl
        # polars uses different kwarg names; strip pandas-only keys
        polars_kwargs = {
            k: v for k, v in kwargs.items()
            if k in ("separator", "encoding", "n_rows", "skip_rows", "has_header", "ignore_errors")
        }
        df = pl.read_csv(path, ignore_errors=True, **polars_kwargs)
        return df.to_pandas()
    elif engine == "duckdb":
        import duckdb
        import pandas as pd
        encoding = kwargs.pop("encoding", "utf-8")
        try:
            rel = duckdb.sql(f"SELECT * FROM read_csv_auto('{path}', ignore_errors=true)")
            return rel.df()
        except Exception:
            return pd.read_csv(path, encoding="latin-1", on_bad_lines="skip")
    elif engine == "rapids":
        import cudf
        return cudf.read_csv(path, **kwargs).to_pandas()
    raise ValueError(f"Unknown engine: {engine}")


def to_parquet(df: Any, path: str) -> None:
    engine = get_engine()
    if engine in ("pandas", "rapids"):
        df.to_parquet(path, index=False)
    elif engine == "polars":
        import polars as pl
        if hasattr(df, "write_parquet"):
            df.write_parquet(path)
        else:
            pl.from_pandas(df).write_parquet(path)
    elif engine == "duckdb":
        import duckdb
        duckdb.execute(f"COPY (SELECT * FROM df) TO '{path}' (FORMAT PARQUET)")
    else:
        raise ValueError(f"Unknown engine: {engine}")
