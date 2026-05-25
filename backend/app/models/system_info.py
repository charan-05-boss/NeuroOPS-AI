"""
NeuroOps AI — System Info Models
Pydantic schemas for general system and hardware information.
"""
from datetime import datetime
from pydantic import BaseModel, Field


class SystemInfoResponse(BaseModel):
    os_name: str = Field(..., description="Operating system name (e.g. Linux, Darwin, Windows)")
    os_release: str = Field(..., description="Operating system release")
    os_version: str = Field(..., description="Operating system version details")
    architecture: str = Field(..., description="Machine architecture (e.g. x86_64, arm64)")
    hostname: str = Field(..., description="System hostname")
    python_version: str = Field(..., description="Python interpreter version")
    cpu_model: str = Field(..., description="CPU model name or processor brand")
    cpu_cores_logical: int = Field(..., description="Number of logical CPU cores")
    cpu_cores_physical: int = Field(..., description="Number of physical CPU cores")
    total_memory_gb: float = Field(..., description="Total system memory in GB")
    total_disk_gb: float = Field(..., description="Total system disk space in GB")
    boot_time: datetime = Field(..., description="System boot timestamp in UTC")
    uptime: str = Field(..., description="Human-readable system uptime")
