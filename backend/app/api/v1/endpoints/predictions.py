"""
NeuroOps AI — Predictions Endpoint
GET /api/v1/predictions — ML-powered metric forecasting & stability analysis
"""
from typing import Annotated

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends

from app.dependencies import get_prediction_engine, get_system_monitor
from app.models.predictions import PredictionResponse
from app.services.prediction_engine import PredictionEngine
from app.services.system_monitor import SystemMonitor

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.get(
    "",
    response_model=PredictionResponse,
    summary="Predictive analytics — forecast CPU/RAM trends, overload probability & stability score",
)
async def get_predictions(
    monitor: Annotated[SystemMonitor, Depends(get_system_monitor)],
    engine: Annotated[PredictionEngine, Depends(get_prediction_engine)],
) -> PredictionResponse:
    """
    Runs the ML prediction pipeline on the current metrics history.

    - Requires at least **10 collected snapshots** (collects every 3 s by default).
    - Returns per-metric forecasts (CPU, RAM, Disk) with confidence bounds,
      trend direction, overload risk, and a composite stability score.
    - Safe to poll — pure read operation, no side effects.
    """
    snapshots = monitor.get_history()
    return engine.predict(snapshots)
