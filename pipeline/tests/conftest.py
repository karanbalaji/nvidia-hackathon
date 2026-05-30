"""Pytest configuration — add project root to sys.path so 'pipeline' package is importable."""
import sys
from pathlib import Path

# conftest.py lives at pipeline/tests/conftest.py
# parent       = pipeline/tests/
# parent.parent = pipeline/
# parent.parent.parent = nvidia-hackathon/  ← what we need on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
