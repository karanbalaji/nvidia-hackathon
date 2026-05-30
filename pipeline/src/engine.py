"""Engine-agnostic data processing abstraction.

Set PIPELINE_ENGINE=pandas|polars|duckdb|rapids.
RAPIDS is only available on the DGX Spark — importing on Mac raises RuntimeError.
"""

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


def read_csv(path: str, **kwargs: Any):
    engine = get_engine()
    if engine == "pandas":
        import pandas as pd
        return pd.read_csv(path, **kwargs)
    elif engine == "polars":
        import polars as pl
        return pl.read_csv(path, **kwargs)
    elif engine == "duckdb":
        import duckdb
        return duckdb.read_csv(path, **kwargs)
    elif engine == "rapids":
        import cudf
        return cudf.read_csv(path, **kwargs)
    raise ValueError(f"Unknown engine: {engine}")


def to_parquet(df: Any, path: str) -> None:
    engine = get_engine()
    if engine in ("pandas", "rapids"):
        df.to_parquet(path, index=False)
    elif engine == "polars":
        df.write_parquet(path)
    elif engine == "duckdb":
        import duckdb
        duckdb.execute(f"COPY ({df}) TO '{path}' (FORMAT PARQUET)")
    else:
        raise ValueError(f"Unknown engine: {engine}")
