"""
NeuroOps AI — Alerts Endpoints
GET    /api/v1/alerts       — List all alerts
POST   /api/v1/alerts       — Create a manual alert
DELETE /api/v1/alerts/{id}  — Dismiss / resolve an alert
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_alert_engine
from app.models.alerts import Alert, AlertCreateRequest, AlertListResponse
from app.services.alert_engine import AlertEngine

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get(
    "",
    response_model=AlertListResponse,
    summary="List alerts",
)
async def list_alerts(
    engine: Annotated[AlertEngine, Depends(get_alert_engine)],
) -> AlertListResponse:
    """Return all alerts sorted by creation time (newest first)."""
    return engine.list_alerts()


@router.post(
    "",
    response_model=Alert,
    status_code=status.HTTP_201_CREATED,
    summary="Create manual alert",
)
async def create_alert(
    payload: AlertCreateRequest,
    engine: Annotated[AlertEngine, Depends(get_alert_engine)],
) -> Alert:
    """Create a manual alert (e.g., from an operator or external system)."""
    return engine.create(payload)


@router.delete(
    "/{alert_id}",
    response_model=Alert,
    summary="Dismiss alert",
)
async def dismiss_alert(
    alert_id: UUID,
    engine: Annotated[AlertEngine, Depends(get_alert_engine)],
) -> Alert:
    """Mark an alert as resolved by its UUID."""
    alert = engine.dismiss(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found",
        )
    return alert
