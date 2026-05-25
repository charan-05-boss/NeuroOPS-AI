"""
Tests for monitor package.
Run with: pytest tests/test_monitor.py -v
"""
import time
import pytest

from monitor.models import (
    CpuStats,
    DiskStats,
    NetworkStats,
    RamStats,
    SystemSnapshot,
    UptimeStats,
)
from monitor.formatters import (
    auto_scale_bytes,
    bytes_to_gb,
    bytes_to_kb,
    bytes_to_mb,
    format_uptime,
    mhz_to_ghz,
    percent_bar,
    clamp_percent,
)
from monitor.collector import (
    collect_cpu,
    collect_disk,
    collect_network,
    collect_ram,
    collect_uptime,
)
from monitor.service import MonitorService


# ── Formatter tests ─────────────────────────────────────────────────────────────

class TestFormatters:
    def test_bytes_to_kb(self):
        assert bytes_to_kb(1_024) == 1.0
        assert bytes_to_kb(2_048) == 2.0

    def test_bytes_to_mb(self):
        assert bytes_to_mb(1_048_576) == 1.0
        assert bytes_to_mb(0) == 0.0

    def test_bytes_to_gb(self):
        assert bytes_to_gb(1_073_741_824) == 1.0

    def test_auto_scale_bytes_bytes(self):
        val, unit = auto_scale_bytes(512)
        assert unit == "B"
        assert val == 512.0

    def test_auto_scale_bytes_kb(self):
        val, unit = auto_scale_bytes(2_048)
        assert unit == "KB"
        assert val == 2.0

    def test_auto_scale_bytes_mb(self):
        val, unit = auto_scale_bytes(5 * 1024 ** 2)
        assert unit == "MB"

    def test_auto_scale_bytes_gb(self):
        val, unit = auto_scale_bytes(3 * 1024 ** 3)
        assert unit == "GB"

    def test_mhz_to_ghz(self):
        assert mhz_to_ghz(2_000) == 2.0
        assert mhz_to_ghz(3_600) == 3.6

    @pytest.mark.parametrize("seconds, expected", [
        (0,       "0s"),
        (45,      "45s"),
        (60,      "1m 0s"),
        (135,     "2m 15s"),
        (3_600,   "1h"),
        (8_100,   "2h 15m"),
        (90_075,  "1d 1h 1m"),
    ])
    def test_format_uptime(self, seconds, expected):
        assert format_uptime(seconds) == expected

    def test_clamp_percent_low(self):
        assert clamp_percent(-10) == 0.0

    def test_clamp_percent_high(self):
        assert clamp_percent(110) == 100.0

    def test_clamp_percent_normal(self):
        assert clamp_percent(55.5) == 55.5

    def test_percent_bar_length(self):
        bar = percent_bar(50, width=10)
        # "█████░░░░░ 50.0%" → bar portion is 10 chars
        assert len(bar.split()[0]) == 10

    def test_percent_bar_full(self):
        bar = percent_bar(100, width=4)
        assert bar.startswith("████")

    def test_percent_bar_empty(self):
        bar = percent_bar(0, width=4)
        assert bar.startswith("░░░░")


# ── Model tests ─────────────────────────────────────────────────────────────────

class TestModels:
    def _make_snapshot(self) -> SystemSnapshot:
        return SystemSnapshot(
            cpu=CpuStats(percent=34.0, per_core=[34.0], logical_cores=4, physical_cores=2, frequency_mhz=3000.0),
            ram=RamStats(total_bytes=8*1024**3, used_bytes=4*1024**3, available_bytes=4*1024**3, percent=56.0, total_gb=8.0, used_gb=4.0, available_gb=4.0),
            disk=DiskStats(mountpoint="/", total_bytes=500*1024**3, used_bytes=360*1024**3, free_bytes=140*1024**3, percent=72.0, total_gb=500.0, used_gb=360.0, free_gb=140.0),
            network=NetworkStats(bytes_sent=12345, bytes_recv=67890, packets_sent=100, packets_recv=200, mb_sent=0.01, mb_recv=0.06),
            uptime=UptimeStats(total_seconds=8100.0, formatted="2h 15m", boot_timestamp=time.time() - 8100),
            collected_at="2026-01-01T00:00:00.000Z",
        )

    def test_snapshot_to_summary_keys(self):
        snap = self._make_snapshot()
        summary = snap.to_summary()
        assert set(summary.keys()) == {"cpu", "ram", "disk", "network_sent", "network_received", "uptime"}

    def test_snapshot_to_summary_values(self):
        snap = self._make_snapshot()
        summary = snap.to_summary()
        assert summary["cpu"] == 34
        assert summary["ram"] == 56
        assert summary["disk"] == 72
        assert summary["network_sent"] == 12345
        assert summary["network_received"] == 67890
        assert summary["uptime"] == "2h 15m"

    def test_snapshot_to_json_is_string(self):
        snap = self._make_snapshot()
        j = snap.to_json()
        assert isinstance(j, str)
        assert '"cpu"' in j

    def test_snapshot_to_summary_json_is_string(self):
        snap = self._make_snapshot()
        j = snap.to_summary_json()
        assert '"cpu"' in j
        assert '"ram"' in j

    def test_snapshot_immutable(self):
        snap = self._make_snapshot()
        with pytest.raises((AttributeError, TypeError)):
            snap.cpu = None  # type: ignore

    def test_to_dict_is_dict(self):
        snap = self._make_snapshot()
        d = snap.to_dict()
        assert isinstance(d, dict)
        assert "cpu" in d and "ram" in d


# ── Collector tests (live psutil) ───────────────────────────────────────────────

class TestCollectors:
    def test_collect_cpu_returns_stats(self):
        stats = collect_cpu(interval=0.05)
        assert isinstance(stats, CpuStats)
        assert 0.0 <= stats.percent <= 100.0
        assert stats.logical_cores >= 1
        assert stats.physical_cores >= 1
        assert len(stats.per_core) == stats.logical_cores

    def test_collect_ram_returns_stats(self):
        stats = collect_ram()
        assert isinstance(stats, RamStats)
        assert stats.total_bytes > 0
        assert 0.0 <= stats.percent <= 100.0
        assert stats.total_gb > 0

    def test_collect_disk_returns_stats(self):
        stats = collect_disk("/")
        assert isinstance(stats, DiskStats)
        assert stats.total_bytes > 0
        assert stats.mountpoint == "/"

    def test_collect_network_returns_stats(self):
        stats = collect_network()
        assert isinstance(stats, NetworkStats)
        assert stats.bytes_sent >= 0
        assert stats.bytes_recv >= 0

    def test_collect_uptime_returns_stats(self):
        stats = collect_uptime()
        assert isinstance(stats, UptimeStats)
        assert stats.total_seconds > 0
        assert len(stats.formatted) > 0


# ── Service tests ───────────────────────────────────────────────────────────────

class TestMonitorService:
    def setup_method(self):
        self.svc = MonitorService(cpu_interval=0.05)

    def test_snapshot_returns_system_snapshot(self):
        snap = self.svc.snapshot()
        assert isinstance(snap, SystemSnapshot)

    def test_snapshot_collected_at_is_set(self):
        snap = self.svc.snapshot()
        assert snap.collected_at.endswith("Z")
        assert "T" in snap.collected_at

    def test_individual_cpu(self):
        result = self.svc.cpu()
        assert isinstance(result, CpuStats)

    def test_individual_ram(self):
        result = self.svc.ram()
        assert isinstance(result, RamStats)

    def test_individual_disk(self):
        result = self.svc.disk()
        assert isinstance(result, DiskStats)

    def test_individual_network(self):
        result = self.svc.network()
        assert isinstance(result, NetworkStats)

    def test_individual_uptime(self):
        result = self.svc.uptime()
        assert isinstance(result, UptimeStats)

    def test_stream_count(self):
        snaps = list(self.svc.stream(interval=0.05, count=3))
        assert len(snaps) == 3
        assert all(isinstance(s, SystemSnapshot) for s in snaps)

    def test_stream_snapshots_have_fresh_timestamps(self):
        snaps = list(self.svc.stream(interval=0.1, count=2))
        # Timestamps should be distinct
        assert snaps[0].collected_at != snaps[1].collected_at

    def test_throughput_returns_tuple(self):
        tx, rx = self.svc.throughput(window=0.1)
        assert isinstance(tx, float)
        assert isinstance(rx, float)
        assert tx >= 0
        assert rx >= 0

    def test_repr(self):
        r = repr(self.svc)
        assert "MonitorService" in r
        assert "cpu_interval" in r
