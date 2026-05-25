"""
NeuroOps AI — Analytics Endpoints
GET /api/v1/analytics/anomalies  — Run Isolation Forest on history
GET /api/v1/analytics/health     — Compute system health score
"""
from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies import get_anomaly_detector, get_system_monitor
from app.models.analytics import AnomalyDetectionResult, SystemHealthScore
from app.services.anomaly_detector import AnomalyDetector
from app.services.system_monitor import SystemMonitor

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/anomalies",
    response_model=AnomalyDetectionResult,
    summary="Anomaly detection",
)
async def get_anomalies(
    monitor: Annotated[SystemMonitor, Depends(get_system_monitor)],
    detector: Annotated[AnomalyDetector, Depends(get_anomaly_detector)],
) -> AnomalyDetectionResult:
    """
    Run unsupervised Isolation Forest on the metrics history.
    Requires at least `ANOMALY_MIN_SAMPLES` collected data points.
    """
    snapshots = monitor.get_history()
    return detector.detect(snapshots)


@router.get(
    "/health-score",
    response_model=SystemHealthScore,
    summary="System health score",
)
async def get_health_score(
    monitor: Annotated[SystemMonitor, Depends(get_system_monitor)],
) -> SystemHealthScore:
    """Compute an aggregate 0–100 health score from the latest snapshot."""
    snap = monitor.get_current()
    # Weighted penalty model: higher usage = lower score
    score = 100.0
    score -= snap.cpu.percent * 0.4
    score -= snap.memory.percent * 0.35
    score -= snap.disk.percent * 0.25
    score = max(0.0, min(100.0, score))

    if score >= 80:
        grade, summary = "A", "System is healthy"
    elif score >= 65:
        grade, summary = "B", "System is under mild load"
    elif score >= 50:
        grade, summary = "C", "System is under moderate load"
    elif score >= 35:
        grade, summary = "D", "System is under heavy load"
    else:
        grade, summary = "F", "System is critically overloaded"

    return SystemHealthScore(score=round(score, 1), grade=grade, summary=summary)
