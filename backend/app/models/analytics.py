"""
NeuroOps AI — Analytics Models
Pydantic schemas for AI analytics and anomaly detection output.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class AnomalyType(str, Enum):
    CPU_SPIKE = "cpu_spike"
    MEMORY_LEAK = "memory_leak"
    DISK_SURGE = "disk_surge"
    NETWORK_ANOMALY = "network_anomaly"
    MULTIVARIATE = "multivariate"


class AnomalyPoint(BaseModel):
    timestamp: datetime
    anomaly_score: float = Field(..., description="Isolation Forest anomaly score (negative = anomalous)")
    is_anomaly: bool
    anomaly_type: Optional[AnomalyType] = None
    cpu_percent: float
    memory_percent: float
    disk_percent: float


class AnomalyDetectionResult(BaseModel):
    model_config = {"protected_namespaces": ()}

    is_model_trained: bool
    samples_used: int
    anomalies_detected: int
    anomaly_rate: float = Field(..., description="Fraction of anomalous points")
    points: List[AnomalyPoint]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class SystemHealthScore(BaseModel):
    """Aggregate health score 0–100 derived from all metrics."""
    score: float = Field(..., ge=0, le=100)
    grade: str = Field(..., description="A/B/C/D/F letter grade")
    summary: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
