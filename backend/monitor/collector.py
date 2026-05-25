"""
monitor.collector
=================
Low-level psutil collection functions.
Each function is pure and stateless — it reads from the OS and returns
a typed dataclass. All heavy lifting is isolated here so that higher
layers remain testable without mocking the OS.

Design principles:
  - One responsibility per function
  - Defensive fallbacks for optional psutil fields
  - No side effects; no global state
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

import psutil

from monitor.formatters import bytes_to_gb, bytes_to_mb, format_uptime
from monitor.models import (
    CpuStats,
    DiskStats,
    NetworkStats,
    RamStats,
    UptimeStats,
)


# ── CPU ────────────────────────────────────────────────────────────────────────

def collect_cpu(interval: float = 0.1) -> CpuStats:
    """
    Collect CPU utilisation metrics.

    Args:
        interval: Blocking measurement window in seconds.
                  Shorter = faster but less accurate.
                  Set to 0 to use the non-blocking cached value.

    Returns:
        CpuStats dataclass with overall %, per-core, counts, and frequency.
    """
    percent = psutil.cpu_percent(interval=interval)
    per_core = psutil.cpu_percent(interval=None, percpu=True)

    logical_cores = psutil.cpu_count(logical=True) or 1
    physical_cores = psutil.cpu_count(logical=False) or 1

    freq = psutil.cpu_freq()
    frequency_mhz = round(freq.current, 1) if freq else 0.0

    return CpuStats(
        percent=round(percent, 1),
        per_core=[round(c, 1) for c in per_core],
        logical_cores=logical_cores,
        physical_cores=physical_cores,
        frequency_mhz=frequency_mhz,
    )


# ── RAM ────────────────────────────────────────────────────────────────────────

def collect_ram() -> RamStats:
    """
    Collect virtual memory (RAM) utilisation.

    Returns:
        RamStats with raw byte counts, percentages, and human-friendly GB values.
    """
    mem = psutil.virtual_memory()
    return RamStats(
        total_bytes=mem.total,
        used_bytes=mem.used,
        available_bytes=mem.available,
        percent=round(mem.percent, 1),
        total_gb=bytes_to_gb(mem.total),
        used_gb=bytes_to_gb(mem.used),
        available_gb=bytes_to_gb(mem.available),
    )


# ── Disk ───────────────────────────────────────────────────────────────────────

def collect_disk(mountpoint: str = "/") -> DiskStats:
    """
    Collect disk utilisation for a given mountpoint.

    Args:
        mountpoint: Filesystem mount path. Defaults to root "/".
                    Use "C:\\" on Windows.

    Returns:
        DiskStats with raw byte counts, percentages, and human-friendly GB values.

    Raises:
        FileNotFoundError: If *mountpoint* does not exist on the system.
    """
    usage = psutil.disk_usage(mountpoint)
    return DiskStats(
        mountpoint=mountpoint,
        total_bytes=usage.total,
        used_bytes=usage.used,
        free_bytes=usage.free,
        percent=round(usage.percent, 1),
        total_gb=bytes_to_gb(usage.total),
        used_gb=bytes_to_gb(usage.used),
        free_gb=bytes_to_gb(usage.free),
    )


# ── Network ────────────────────────────────────────────────────────────────────

def collect_network() -> NetworkStats:
    """
    Collect cumulative network I/O counters (since boot).

    Returns:
        NetworkStats with raw byte/packet counts and human-friendly MB values.

    Note:
        These are *cumulative* counters, not per-second rates.
        To calculate throughput, subtract two snapshots and divide by
        the elapsed time. See MonitorService.throughput() for this.
    """
    net = psutil.net_io_counters()
    return NetworkStats(
        bytes_sent=net.bytes_sent,
        bytes_recv=net.bytes_recv,
        packets_sent=net.packets_sent,
        packets_recv=net.packets_recv,
        mb_sent=bytes_to_mb(net.bytes_sent),
        mb_recv=bytes_to_mb(net.bytes_recv),
    )


# ── Uptime ─────────────────────────────────────────────────────────────────────

def collect_uptime() -> UptimeStats:
    """
    Compute system uptime from the boot timestamp.

    Returns:
        UptimeStats with raw seconds, formatted string, and Unix boot timestamp.
    """
    boot_timestamp = psutil.boot_time()
    total_seconds = time.time() - boot_timestamp
    return UptimeStats(
        total_seconds=round(total_seconds, 2),
        formatted=format_uptime(total_seconds),
        boot_timestamp=boot_timestamp,
    )


# ── Timestamp ──────────────────────────────────────────────────────────────────

def utc_now_iso() -> str:
    """Return the current UTC time as an ISO-8601 string with 'Z' suffix."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
