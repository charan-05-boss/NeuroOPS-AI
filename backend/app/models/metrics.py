"""
NeuroOps AI — Metrics Models
Pydantic schemas for system metric data transfer.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CpuMetrics(BaseModel):
    percent: float = Field(..., ge=0, le=100, description="CPU usage percentage")
    count_logical: int = Field(..., description="Logical CPU count")
    count_physical: Optional[int] = Field(None, description="Physical CPU count")
    frequency_mhz: Optional[float] = Field(None, description="Current CPU frequency (MHz)")


class MemoryMetrics(BaseModel):
    total_gb: float = Field(..., description="Total RAM in GB")
    available_gb: float = Field(..., description="Available RAM in GB")
    used_gb: float = Field(..., description="Used RAM in GB")
    percent: float = Field(..., ge=0, le=100, description="Memory usage percentage")


class DiskMetrics(BaseModel):
    total_gb: float = Field(..., description="Total disk in GB")
    used_gb: float = Field(..., description="Used disk in GB")
    free_gb: float = Field(..., description="Free disk in GB")
    percent: float = Field(..., ge=0, le=100, description="Disk usage percentage")
    mountpoint: str = Field(default="/", description="Mountpoint path")


class NetworkMetrics(BaseModel):
    bytes_sent_mb: float = Field(..., description="Total bytes sent (MB)")
    bytes_recv_mb: float = Field(..., description="Total bytes received (MB)")
    packets_sent: int = Field(..., description="Total packets sent")
    packets_recv: int = Field(..., description="Total packets received")


class ProcessMetrics(BaseModel):
    total: int = Field(..., description="Total running processes")
    running: int = Field(..., description="Active running processes")
    sleeping: int = Field(..., description="Sleeping processes")


class SystemMetricsSnapshot(BaseModel):
    """A complete system metrics snapshot at a point in time."""

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    cpu: CpuMetrics
    memory: MemoryMetrics
    disk: DiskMetrics
    network: NetworkMetrics
    processes: ProcessMetrics


class MetricsHistoryResponse(BaseModel):
    count: int
    snapshots: List[SystemMetricsSnapshot]
