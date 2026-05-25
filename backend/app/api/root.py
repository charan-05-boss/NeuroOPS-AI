"""
NeuroOps AI — Root API Router
Aggregates all root-level endpoint routers.
"""
from fastapi import APIRouter

from app.api.endpoints import health, metrics, system_info, ai_analysis

root_router = APIRouter()

root_router.include_router(health.router)
root_router.include_router(metrics.router)
root_router.include_router(system_info.router)
root_router.include_router(ai_analysis.router)
