"""
NeuroOps AI — Root Metrics Endpoint
GET /metrics — Flat live system metrics summary
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.dependencies import get_monitor_service
from monitor import MonitorService

router = APIRouter(tags=["Metrics"])


class FlatMetricsResponse(BaseModel):
    cpu: int = Field(..., description="CPU usage percentage")
    ram: int = Field(..., description="RAM usage percentage")
    disk: int = Field(..., description="Disk usage percentage")
    network_sent: int = Field(..., description="Total network bytes sent")
    network_received: int = Field(..., description="Total network bytes received")
    uptime: str = Field(..., description="Uptime string (e.g. '2h 15m')")


@router.get("/metrics", response_model=FlatMetricsResponse, summary="Flat live metrics summary")
async def get_metrics(
    svc: MonitorService = Depends(get_monitor_service)
) -> FlatMetricsResponse:
    """
    Returns live system monitoring data in a flat JSON structure.
    Integrates directly with the psutil-based MonitorService.
    """
    snapshot = svc.snapshot()
    return FlatMetricsResponse(**snapshot.to_summary())
