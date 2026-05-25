"""
NeuroOps AI — Shared Utilities
"""
from datetime import datetime


def bytes_to_gb(value: int) -> float:
    return round(value / (1024 ** 3), 2)


def bytes_to_mb(value: int) -> float:
    return round(value / (1024 ** 2), 2)


def utc_now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"
