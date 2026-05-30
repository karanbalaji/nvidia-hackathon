"""Canonical category mapping for 311 service request types.

Maps raw SR type strings → one of: pothole, garbage, flooding, graffiti, tree, noise, other.
Matching is done by substring (case-insensitive) in priority order.
"""

from typing import Final

CANONICAL_CATEGORIES: Final[list[str]] = [
    "pothole",
    "garbage",
    "flooding",
    "graffiti",
    "tree",
    "noise",
    "other",
]

# Each entry: (substring_to_match, canonical_category)
# Checked in order — first match wins.
_RULES: list[tuple[str, str]] = [
    # Pothole / road damage
    ("pothole", "pothole"),
    ("road damage", "pothole"),
    ("road - sinking", "pothole"),
    ("damaged concrete sidewalk", "pothole"),
    ("sidewalk repair", "pothole"),
    # Flooding / water
    ("flooding", "flooding"),
    ("flood", "flooding"),
    ("catch basin", "flooding"),
    ("watermain", "flooding"),
    ("water main", "flooding"),
    ("sewer", "flooding"),
    ("water service", "flooding"),
    ("water infrastructure", "flooding"),
    # Garbage / solid waste
    ("garbage", "garbage"),
    ("recycl", "garbage"),
    ("organic green bin", "garbage"),
    ("solid waste", "garbage"),
    ("bin", "garbage"),
    ("litter", "garbage"),
    ("illegal dump", "garbage"),
    ("debris", "garbage"),
    ("hazardous waste", "garbage"),
    ("furniture", "garbage"),
    ("bulk", "garbage"),
    # Graffiti
    ("graffiti", "graffiti"),
    ("vandal", "graffiti"),
    # Tree / forestry
    ("tree", "tree"),
    ("forest", "tree"),
    ("pruning", "tree"),
    ("stump", "tree"),
    ("branch", "tree"),
    # Noise
    ("noise", "noise"),
    ("sound", "noise"),
    ("amplified", "noise"),
    ("music", "noise"),
    ("construction noise", "noise"),
]


def normalize_category(raw_type: str) -> str:
    """Return the canonical category for a raw 311 SR type string."""
    lower = raw_type.lower()
    for keyword, category in _RULES:
        if keyword in lower:
            return category
    return "other"
