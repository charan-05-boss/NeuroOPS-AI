"""
NeuroOps AI — Root Health Endpoint
GET /health — system liveness probe
"""
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from app.config import get_settings

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    timestamp: datetime


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health_check() -> HealthResponse:
    """Liveness probe — returns 200 if backend is up."""
    settings = get_settings()
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        timestamp=datetime.utcnow(),
    )
