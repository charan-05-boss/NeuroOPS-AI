"""
monitor.formatters
==================
Pure utility functions for unit conversion and human-readable formatting.
No external dependencies — stdlib only.
"""
from __future__ import annotations

import math
from typing import Tuple

# ── Constants ──────────────────────────────────────────────────────────────────

_BYTES_PER_KB = 1_024
_BYTES_PER_MB = 1_024 ** 2
_BYTES_PER_GB = 1_024 ** 3


# ── Byte conversion ────────────────────────────────────────────────────────────

def bytes_to_kb(value: int, decimals: int = 2) -> float:
    """Convert bytes → kilobytes."""
    return round(value / _BYTES_PER_KB, decimals)


def bytes_to_mb(value: int, decimals: int = 2) -> float:
    """Convert bytes → megabytes."""
    return round(value / _BYTES_PER_MB, decimals)


def bytes_to_gb(value: int, decimals: int = 2) -> float:
    """Convert bytes → gigabytes."""
    return round(value / _BYTES_PER_GB, decimals)


def auto_scale_bytes(value: int) -> Tuple[float, str]:
    """
    Automatically pick the best unit for *value* bytes.

    Returns (scaled_value, unit_label).

    Examples:
        auto_scale_bytes(512)           → (512.0, "B")
        auto_scale_bytes(2_048)         → (2.0, "KB")
        auto_scale_bytes(15_728_640)    → (15.0, "MB")
        auto_scale_bytes(3_221_225_472) → (3.0, "GB")
    """
    if value < _BYTES_PER_KB:
        return float(value), "B"
    elif value < _BYTES_PER_MB:
        return round(value / _BYTES_PER_KB, 1), "KB"
    elif value < _BYTES_PER_GB:
        return round(value / _BYTES_PER_MB, 1), "MB"
    else:
        return round(value / _BYTES_PER_GB, 2), "GB"


# ── Frequency conversion ───────────────────────────────────────────────────────

def mhz_to_ghz(mhz: float, decimals: int = 2) -> float:
    """Convert MHz → GHz."""
    return round(mhz / 1_000, decimals)


# ── Uptime formatting ──────────────────────────────────────────────────────────

def format_uptime(total_seconds: float) -> str:
    """
    Convert raw seconds into a human-readable uptime string.

    Examples:
        format_uptime(45)        → "45s"
        format_uptime(135)       → "2m 15s"
        format_uptime(8100)      → "2h 15m"
        format_uptime(90_075)    → "1d 1h 1m"
    """
    total_seconds = max(0, int(total_seconds))
    days, remainder = divmod(total_seconds, 86_400)
    hours, remainder = divmod(remainder, 3_600)
    minutes, seconds = divmod(remainder, 60)

    parts = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    # Only show seconds when uptime is less than 1 hour
    if not days and not hours:
        parts.append(f"{seconds}s")

    return " ".join(parts) if parts else "0s"


# ── Percentage helpers ─────────────────────────────────────────────────────────

def clamp_percent(value: float) -> float:
    """Clamp a percentage to [0.0, 100.0]."""
    return max(0.0, min(100.0, value))


def percent_bar(value: float, width: int = 20, fill: str = "█", empty: str = "░") -> str:
    """
    Render a simple ASCII progress bar for a percentage value.

    Example:
        percent_bar(45, width=10) → "████░░░░░░ 45%"
    """
    value = clamp_percent(value)
    filled = math.floor((value / 100) * width)
    bar = fill * filled + empty * (width - filled)
    return f"{bar} {value:.1f}%"
