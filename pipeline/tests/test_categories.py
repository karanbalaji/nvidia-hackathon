"""Tests for pipeline/src/categories.py — TDD red phase first."""

import pytest


def test_pothole_maps_correctly():
    from pipeline.src.categories import normalize_category
    assert normalize_category("Road Pothole / Road Damage") == "pothole"


def test_garbage_maps_correctly():
    from pipeline.src.categories import normalize_category
    assert normalize_category("Res / Garbage / Not Picked Up") == "garbage"


def test_flooding_maps_correctly():
    from pipeline.src.categories import normalize_category
    assert normalize_category("Catch Basin - Blocked / Flooding") == "flooding"


def test_graffiti_maps_correctly():
    from pipeline.src.categories import normalize_category
    assert normalize_category("Graffiti Removal") == "graffiti"


def test_tree_maps_correctly():
    from pipeline.src.categories import normalize_category
    assert normalize_category("Tree Emergency Clean-Up") == "tree"


def test_noise_maps_correctly():
    from pipeline.src.categories import normalize_category
    assert normalize_category("Amplified Sound or Instrument Sound") == "noise"


def test_unknown_maps_to_other():
    from pipeline.src.categories import normalize_category
    assert normalize_category("Some Unknown SR Type XYZ") == "other"


def test_case_insensitive():
    from pipeline.src.categories import normalize_category
    assert normalize_category("road pothole / road damage") == "pothole"


def test_all_canonical_categories_present():
    from pipeline.src.categories import CANONICAL_CATEGORIES
    assert set(CANONICAL_CATEGORIES) == {"pothole", "garbage", "flooding", "graffiti", "tree", "noise", "other"}
