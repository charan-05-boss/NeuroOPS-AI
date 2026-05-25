"""
monitor.service
===============
MonitorService — the single public interface for all monitoring operations.

Usage:
    from monitor import MonitorService

    svc = MonitorService()

    # One-shot snapshot
    snap = svc.snapshot()
    print(snap.to_summary_json())

    # Continuous monitoring
    for snap in svc.stream(interval=2.0, count=5):
        print(snap.to_summary_json())

    # Network throughput (bytes/sec)
    tx, rx = svc.throughput(window=1.0)
    print(f"↑ {tx:.0f} B/s  ↓ {rx:.0f} B/s")

    # Individual metric access
    cpu  = svc.cpu()
    ram  = svc.ram()
    disk = svc.disk()
    net  = svc.network()
    up   = svc.uptime()
"""
from __future__ import annotations

import time
from typing import Generator, Iterator, Optional, Tuple

from monitor.collector import (
    collect_cpu,
    collect_disk,
    collect_network,
    collect_ram,
    collect_uptime,
    utc_now_iso,
)
from monitor.models import (
    CpuStats,
    DiskStats,
    NetworkStats,
    RamStats,
    SystemSnapshot,
    UptimeStats,
)


class MonitorService:
    """
    Orchestrates metric collection and exposes a clean, reusable API.

    Args:
        cpu_interval:  Blocking window (seconds) for cpu_percent measurement.
                       Lower = faster; higher = more accurate.
        disk_mount:    Mountpoint to monitor. Default is "/" (Linux/macOS).
                       Use "C:\\\\" on Windows.
    """

    def __init__(
        self,
        cpu_interval: float = 0.1,
        disk_mount: str = "/",
    ) -> None:
        self._cpu_interval = cpu_interval
        self._disk_mount = disk_mount

    # ── Individual metrics ─────────────────────────────────────────────────────

    def cpu(self) -> CpuStats:
        """Return current CPU metrics."""
        return collect_cpu(interval=self._cpu_interval)

    def ram(self) -> RamStats:
        """Return current RAM metrics."""
        return collect_ram()

    def disk(self, mountpoint: Optional[str] = None) -> DiskStats:
        """Return disk metrics for *mountpoint* (defaults to configured mount)."""
        return collect_disk(mountpoint or self._disk_mount)

    def network(self) -> NetworkStats:
        """Return cumulative network I/O counters since boot."""
        return collect_network()

    def uptime(self) -> UptimeStats:
        """Return system uptime details."""
        return collect_uptime()

    # ── Full snapshot ──────────────────────────────────────────────────────────

    def snapshot(self) -> SystemSnapshot:
        """
        Collect all metrics in a single call and return a SystemSnapshot.

        This is the primary method. The snapshot is immutable and
        can be serialised with:
            snap.to_summary_json()   → required output format
            snap.to_json()           → full nested details
            snap.to_summary()        → plain dict
        """
        return SystemSnapshot(
            cpu=self.cpu(),
            ram=self.ram(),
            disk=self.disk(),
            network=self.network(),
            uptime=self.uptime(),
            collected_at=utc_now_iso(),
        )

    # ── Streaming ─────────────────────────────────────────────────────────────

    def stream(
        self,
        interval: float = 1.0,
        count: Optional[int] = None,
    ) -> Generator[SystemSnapshot, None, None]:
        """
        Yield SystemSnapshot objects at a fixed interval.

        Args:
            interval: Seconds between each snapshot. Default 1s.
            count:    Number of snapshots to yield before stopping.
                      Pass None (default) to stream indefinitely.

        Yields:
            SystemSnapshot on every tick.

        Example:
            for snap in svc.stream(interval=2.0, count=10):
                print(snap.to_summary_json())
        """
        emitted = 0
        while count is None or emitted < count:
            yield self.snapshot()
            emitted += 1
            if count is None or emitted < count:
                time.sleep(interval)

    # ── Network throughput ─────────────────────────────────────────────────────

    def throughput(self, window: float = 1.0) -> Tuple[float, float]:
        """
        Measure real-time network throughput by diffing two snapshots.

        Args:
            window: Measurement window in seconds. Default 1s.

        Returns:
            (bytes_sent_per_sec, bytes_recv_per_sec) as a tuple of floats.

        Example:
            tx, rx = svc.throughput(window=1.0)
            print(f"↑ {tx:.0f} B/s  ↓ {rx:.0f} B/s")
        """
        before = collect_network()
        time.sleep(window)
        after = collect_network()

        sent_per_sec = (after.bytes_sent - before.bytes_sent) / window
        recv_per_sec = (after.bytes_recv - before.bytes_recv) / window
        return round(sent_per_sec, 2), round(recv_per_sec, 2)

    # ── Repr ───────────────────────────────────────────────────────────────────

    def __repr__(self) -> str:
        return (
            f"MonitorService("
            f"cpu_interval={self._cpu_interval}s, "
            f"disk_mount='{self._disk_mount}')"
        )
