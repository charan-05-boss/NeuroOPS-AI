"""
NeuroOps AI — System Monitor Service
Collects real-time system metrics using psutil and maintains an in-memory
rolling history buffer.
"""
from collections import deque
from datetime import datetime
from typing import List, Optional

import psutil

from app.config import get_settings
from app.models.metrics import (
    CpuMetrics,
    DiskMetrics,
    MemoryMetrics,
    NetworkMetrics,
    ProcessMetrics,
    SystemMetricsSnapshot,
)


class SystemMonitor:
    """
    Collects system metrics via psutil and stores them in a bounded deque.
    Designed as a singleton service — inject via FastAPI dependency.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._history: deque = deque(
            maxlen=settings.metrics_history_limit
        )

    # ── Public API ──────────────────────────────────────────────────────────

    def collect(self) -> SystemMetricsSnapshot:
        """Collect a fresh snapshot and append it to history. Returns it."""
        snapshot = self._build_snapshot()
        self._history.append(snapshot)
        return snapshot

    def get_current(self) -> SystemMetricsSnapshot:
        """Return latest snapshot, collecting a fresh one if history is empty."""
        if self._history:
            return self._history[-1]
        return self.collect()

    def get_history(self, limit: Optional[int] = None) -> List[SystemMetricsSnapshot]:
        """Return the history list, optionally capped at *limit* most-recent items."""
        items = list(self._history)
        if limit is not None:
            items = items[-limit:]
        return items

    def history_length(self) -> int:
        return len(self._history)

    # ── Private helpers ─────────────────────────────────────────────────────

    def _build_snapshot(self) -> SystemMetricsSnapshot:
        return SystemMetricsSnapshot(
            timestamp=datetime.utcnow(),
            cpu=self._cpu_metrics(),
            memory=self._memory_metrics(),
            disk=self._disk_metrics(),
            network=self._network_metrics(),
            processes=self._process_metrics(),
        )

    @staticmethod
    def _cpu_metrics() -> CpuMetrics:
        freq = psutil.cpu_freq()
        return CpuMetrics(
            percent=psutil.cpu_percent(interval=0.1),
            count_logical=psutil.cpu_count(logical=True) or 1,
            count_physical=psutil.cpu_count(logical=False),
            frequency_mhz=freq.current if freq else None,
        )

    @staticmethod
    def _memory_metrics() -> MemoryMetrics:
        mem = psutil.virtual_memory()
        gb = 1024 ** 3
        return MemoryMetrics(
            total_gb=round(mem.total / gb, 2),
            available_gb=round(mem.available / gb, 2),
            used_gb=round(mem.used / gb, 2),
            percent=mem.percent,
        )

    @staticmethod
    def _disk_metrics() -> DiskMetrics:
        disk = psutil.disk_usage("/")
        gb = 1024 ** 3
        return DiskMetrics(
            total_gb=round(disk.total / gb, 2),
            used_gb=round(disk.used / gb, 2),
            free_gb=round(disk.free / gb, 2),
            percent=disk.percent,
            mountpoint="/",
        )

    @staticmethod
    def _network_metrics() -> NetworkMetrics:
        net = psutil.net_io_counters()
        mb = 1024 ** 2
        return NetworkMetrics(
            bytes_sent_mb=round(net.bytes_sent / mb, 2),
            bytes_recv_mb=round(net.bytes_recv / mb, 2),
            packets_sent=net.packets_sent,
            packets_recv=net.packets_recv,
        )

    @staticmethod
    def _process_metrics() -> ProcessMetrics:
        statuses = [p.status() for p in psutil.process_iter(["status"])]
        running = sum(1 for s in statuses if s == "running")
        sleeping = sum(1 for s in statuses if s in ("sleeping", "idle"))
        return ProcessMetrics(
            total=len(statuses),
            running=running,
            sleeping=sleeping,
        )


# Module-level singleton — imported and shared across the app
system_monitor = SystemMonitor()
