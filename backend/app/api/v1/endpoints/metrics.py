"""
NeuroOps AI — Metrics Endpoints
GET /api/v1/metrics/current  — Latest system snapshot
GET /api/v1/metrics/history  — Rolling history (last N points)
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_system_monitor
from app.models.metrics import MetricsHistoryResponse, SystemMetricsSnapshot
from app.services.system_monitor import SystemMonitor

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get(
    "/current",
    response_model=SystemMetricsSnapshot,
    summary="Current system metrics",
)
async def get_current_metrics(
    monitor: Annotated[SystemMonitor, Depends(get_system_monitor)],
) -> SystemMetricsSnapshot:
    """Collect and return a fresh system metrics snapshot."""
    return monitor.collect()


@router.get(
    "/history",
    response_model=MetricsHistoryResponse,
    summary="Historical metrics",
)
async def get_metrics_history(
    monitor: Annotated[SystemMonitor, Depends(get_system_monitor)],
    limit: Optional[int] = Query(default=None, ge=1, le=500, description="Max points to return"),
) -> MetricsHistoryResponse:
    """Return the rolling history buffer, optionally capped at *limit* items."""
    snapshots = monitor.get_history(limit=limit)
    return MetricsHistoryResponse(count=len(snapshots), snapshots=snapshots)
