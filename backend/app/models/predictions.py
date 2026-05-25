"""
NeuroOps AI — Prediction Models
Pydantic schemas for the ML-based prediction engine output.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class TrendDirection(str, Enum):
    RISING = "rising"
    STABLE = "stable"
    FALLING = "falling"


class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class MetricForecast(BaseModel):
    """Predicted values for a single metric over the next N steps."""

    metric: str = Field(..., description="Metric name (cpu, memory, disk)")
    current_value: float = Field(..., description="Latest observed value (%)")
    predicted_values: List[float] = Field(
        ..., description="Forecasted values for the next N intervals"
    )
    predicted_peak: float = Field(..., description="Max forecasted value in window")
    predicted_avg: float = Field(..., description="Mean forecasted value in window")
    confidence_lower: float = Field(..., description="Lower confidence bound (%)")
    confidence_upper: float = Field(..., description="Upper confidence bound (%)")
    trend_direction: TrendDirection
    trend_slope: float = Field(
        ..., description="Rate of change per sample (positive = rising)"
    )
    will_exceed_threshold: bool = Field(
        ..., description="Whether metric is predicted to breach alert threshold"
    )
    threshold: float = Field(..., description="The alert threshold for this metric")


class StabilityReport(BaseModel):
    """Aggregate system stability assessment."""

    score: float = Field(..., ge=0, le=100, description="Stability score 0–100")
    grade: str = Field(..., description="Letter grade A–F")
    risk_level: RiskLevel
    overload_probability: float = Field(
        ..., ge=0, le=1, description="Probability of system overload in the forecast window"
    )
    contributing_factors: List[str] = Field(
        ..., description="Human-readable reasons driving instability"
    )
    summary: str = Field(..., description="One-line summary of stability state")


class PredictionResponse(BaseModel):
    """Top-level response from the /predictions endpoint."""

    model_config = {"protected_namespaces": ()}

    is_model_ready: bool = Field(
        ..., description="False when history is too short to generate reliable forecasts"
    )
    samples_used: int
    forecast_steps: int = Field(
        ..., description="How many future intervals were predicted"
    )
    forecast_interval_seconds: int = Field(
        ..., description="Collection interval — each step represents this many seconds"
    )
    cpu_forecast: Optional[MetricForecast] = None
    memory_forecast: Optional[MetricForecast] = None
    disk_forecast: Optional[MetricForecast] = None
    stability: Optional[StabilityReport] = None
    history_cpu: List[float] = Field(
        default_factory=list, description="Historical CPU % values for sparkline"
    )
    history_memory: List[float] = Field(
        default_factory=list, description="Historical memory % values for sparkline"
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)
