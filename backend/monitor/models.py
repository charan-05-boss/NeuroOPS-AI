"""
monitor.models
==============
Typed dataclasses representing every metric category.
All classes are immutable (frozen=True) and provide:
  - .to_dict()  → plain Python dict
  - .to_json()  → formatted JSON string
"""
import json
from dataclasses import dataclass, asdict
from typing import Dict, Any


# ── Helpers ────────────────────────────────────────────────────────────────────

def _to_json(obj: Any) -> str:
    """Serialize a dataclass to a pretty-printed JSON string."""
    return json.dumps(asdict(obj), indent=2, ensure_ascii=False)


# ── Metric structs ─────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class CpuStats:
    """CPU utilisation metrics."""
    percent: float          # Overall CPU % (0–100)
    per_core: list          # Per-core usage list
    logical_cores: int      # Logical (hyper-threaded) core count
    physical_cores: int     # Physical core count
    frequency_mhz: float    # Current clock speed in MHz (0 if unavailable)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return _to_json(self)


@dataclass(frozen=True)
class RamStats:
    """System RAM utilisation metrics."""
    total_bytes: int        # Total installed RAM (bytes)
    used_bytes: int         # Currently used RAM (bytes)
    available_bytes: int    # Free + reclaimable RAM (bytes)
    percent: float          # Usage % (0–100)
    total_gb: float         # Human-friendly total in GB
    used_gb: float          # Human-friendly used in GB
    available_gb: float     # Human-friendly available in GB

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return _to_json(self)


@dataclass(frozen=True)
class DiskStats:
    """Primary disk partition utilisation metrics."""
    mountpoint: str         # Partition mount path (e.g. "/")
    total_bytes: int        # Partition total size (bytes)
    used_bytes: int         # Bytes in use
    free_bytes: int         # Bytes free
    percent: float          # Usage % (0–100)
    total_gb: float         # Human-friendly total in GB
    used_gb: float          # Human-friendly used in GB
    free_gb: float          # Human-friendly free in GB

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return _to_json(self)


@dataclass(frozen=True)
class NetworkStats:
    """Cumulative network I/O counters since boot."""
    bytes_sent: int         # Total bytes transmitted
    bytes_recv: int         # Total bytes received
    packets_sent: int       # Total packets transmitted
    packets_recv: int       # Total packets received
    mb_sent: float          # Human-friendly sent in MB
    mb_recv: float          # Human-friendly received in MB

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return _to_json(self)


@dataclass(frozen=True)
class UptimeStats:
    """System uptime information."""
    total_seconds: float    # Raw uptime in seconds
    formatted: str          # Human-readable: "2h 15m 30s"
    boot_timestamp: float   # Unix boot timestamp

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return _to_json(self)


# ── Composite snapshot ─────────────────────────────────────────────────────────

@dataclass(frozen=True)
class SystemSnapshot:
    """
    Complete point-in-time system metrics snapshot.

    The flat summary format matches the required output spec:
    {
      "cpu": 34,
      "ram": 56,
      "disk": 72,
      "network_sent": 12345,
      "network_received": 67890,
      "uptime": "2h 15m"
    }
    """
    cpu: CpuStats
    ram: RamStats
    disk: DiskStats
    network: NetworkStats
    uptime: UptimeStats
    collected_at: str       # ISO-8601 UTC timestamp

    # ── Serialisation ──────────────────────────────────────────────────────────

    def to_dict(self) -> Dict[str, Any]:
        """Full nested dict with all metric details."""
        return asdict(self)

    def to_json(self, indent: int = 2) -> str:
        """Full nested JSON with all metric details."""
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    def to_summary(self) -> Dict[str, Any]:
        """
        Flat summary matching the required output spec.
        Percentages are rounded integers; network values are raw bytes.
        """
        return {
            "cpu": round(self.cpu.percent),
            "ram": round(self.ram.percent),
            "disk": round(self.disk.percent),
            "network_sent": self.network.bytes_sent,
            "network_received": self.network.bytes_recv,
            "uptime": self.uptime.formatted,
        }

    def to_summary_json(self, indent: int = 2) -> str:
        """Flat summary as JSON string (matches the required output spec)."""
        return json.dumps(self.to_summary(), indent=indent, ensure_ascii=False)
