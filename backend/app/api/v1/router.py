"""
NeuroOps AI — API v1 Router
Aggregates all endpoint routers under /api/v1.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import alerts, analytics, chat, health, metrics, predictions

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(metrics.router)
api_router.include_router(analytics.router)
api_router.include_router(alerts.router)
api_router.include_router(predictions.router)
api_router.include_router(chat.router)
