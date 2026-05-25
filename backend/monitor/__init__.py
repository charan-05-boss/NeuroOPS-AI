"""
NeuroOps AI — System Monitor Package
=====================================
A lightweight, modular psutil-based system monitoring engine.

Public API:
    from monitor import MonitorService
    svc = MonitorService()
    snapshot = svc.snapshot()   # → SystemSnapshot
    print(snapshot.to_json())   # → clean JSON string
"""
from monitor.service import MonitorService
from monitor.models import SystemSnapshot, CpuStats, RamStats, DiskStats, NetworkStats

__all__ = ["MonitorService", "SystemSnapshot", "CpuStats", "RamStats", "DiskStats", "NetworkStats"]
__version__ = "1.0.0"
