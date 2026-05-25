"""
NeuroOps AI — Alert Models
Pydantic schemas for the alerting system.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class AlertSeverity(str, Enum):
    WARNING = "warning"
    CRITICAL = "critical"
    ANOMALY = "anomaly"


class AlertStatus(str, Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class AlertCategory(str, Enum):
    CPU = "cpu"
    MEMORY = "memory"
    DISK = "disk"
    NETWORK = "network"
    ANOMALY = "anomaly"
    MANUAL = "manual"


class Alert(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    message: str
    severity: AlertSeverity
    category: AlertCategory
    status: AlertStatus = AlertStatus.ACTIVE
    metric_value: Optional[float] = None
    threshold: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None


class AlertCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    severity: AlertSeverity = AlertSeverity.WARNING
    category: AlertCategory = AlertCategory.MANUAL


class AlertListResponse(BaseModel):
    total: int
    active: int
    alerts: List["Alert"]
