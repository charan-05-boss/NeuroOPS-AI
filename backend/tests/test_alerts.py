"""
NeuroOps AI — Backend Tests: Alert Engine
"""
from datetime import datetime
from app.models.metrics import (
    SystemMetricsSnapshot,
    CpuMetrics,
    MemoryMetrics,
    DiskMetrics,
    NetworkMetrics,
    ProcessMetrics,
)
from app.services.alert_engine import AlertEngine
from app.models.alerts import AlertCategory, AlertSeverity, AlertStatus


def _create_mock_snapshot(cpu: float, memory: float, disk: float) -> SystemMetricsSnapshot:
    return SystemMetricsSnapshot(
        timestamp=datetime.utcnow(),
        cpu=CpuMetrics(
            percent=cpu,
            count_logical=8,
            count_physical=4,
            frequency_mhz=3200.0,
        ),
        memory=MemoryMetrics(
            total_gb=16.0,
            available_gb=16.0 * (1 - memory/100),
            used_gb=16.0 * (memory/100),
            percent=memory,
        ),
        disk=DiskMetrics(
            total_gb=500.0,
            used_gb=500.0 * (disk/100),
            free_gb=500.0 * (1 - disk/100),
            percent=disk,
            mountpoint="/",
        ),
        network=NetworkMetrics(
            bytes_sent_mb=10.0,
            bytes_recv_mb=20.0,
            packets_sent=100,
            packets_recv=200,
        ),
        processes=ProcessMetrics(
            total=150,
            running=2,
            sleeping=148,
        ),
    )


def test_alert_engine_threshold_triggers():
    engine = AlertEngine()
    
    # 1. Normal state - no alerts
    snap_normal = _create_mock_snapshot(cpu=50.0, memory=70.0, disk=50.0)
    alerts = engine.evaluate(snap_normal)
    assert len(alerts) == 0
    
    # 2. CPU Warning Trigger (>85%)
    snap_cpu_warn = _create_mock_snapshot(cpu=87.0, memory=70.0, disk=50.0)
    alerts = engine.evaluate(snap_cpu_warn)
    assert len(alerts) == 1
    assert alerts[0].category == AlertCategory.CPU
    assert alerts[0].severity == AlertSeverity.WARNING
    
    # 3. CPU Critical Trigger (>95%)
    snap_cpu_crit = _create_mock_snapshot(cpu=96.0, memory=70.0, disk=50.0)
    alerts = engine.evaluate(snap_cpu_crit)
    # The warning should be resolved, and a critical alert is returned
    assert len(alerts) == 1
    assert alerts[0].category == AlertCategory.CPU
    assert alerts[0].severity == AlertSeverity.CRITICAL
    
    # Check that warning is now resolved in list_alerts
    all_alerts = engine.list_alerts().alerts
    resolved_cpu_warn = [a for a in all_alerts if a.category == AlertCategory.CPU and a.severity == AlertSeverity.WARNING]
    assert len(resolved_cpu_warn) == 1
    assert resolved_cpu_warn[0].status == AlertStatus.RESOLVED


def test_alert_engine_memory_and_disk():
    engine = AlertEngine()
    
    # RAM > 90% (Critical)
    snap_ram = _create_mock_snapshot(cpu=50.0, memory=92.0, disk=50.0)
    alerts = engine.evaluate(snap_ram)
    assert len(alerts) == 1
    assert alerts[0].category == AlertCategory.MEMORY
    assert alerts[0].severity == AlertSeverity.CRITICAL

    # Disk > 90% (Critical)
    snap_disk = _create_mock_snapshot(cpu=50.0, memory=70.0, disk=91.0)
    alerts = engine.evaluate(snap_disk)
    assert len(alerts) == 1
    assert alerts[0].category == AlertCategory.DISK
    assert alerts[0].severity == AlertSeverity.CRITICAL


def test_alert_engine_auto_resolution():
    engine = AlertEngine()
    
    # Trigger critical CPU
    snap_cpu_crit = _create_mock_snapshot(cpu=97.0, memory=70.0, disk=50.0)
    engine.evaluate(snap_cpu_crit)
    active_alerts = [a for a in engine.list_alerts().alerts if a.status == AlertStatus.ACTIVE]
    assert len(active_alerts) == 1
    
    # Normal metrics again
    snap_normal = _create_mock_snapshot(cpu=50.0, memory=70.0, disk=50.0)
    engine.evaluate(snap_normal)
    active_alerts = [a for a in engine.list_alerts().alerts if a.status == AlertStatus.ACTIVE]
    assert len(active_alerts) == 0
    
    # Check resolved status in list
    all_alerts = engine.list_alerts().alerts
    assert len(all_alerts) == 1
    assert all_alerts[0].status == AlertStatus.RESOLVED
    assert all_alerts[0].resolved_at is not None
