"""
NeuroOps AI — FastAPI Application Entrypoint
"""
import asyncio

import structlog
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.api.root import root_router
from app.api.v1.router import api_router
from app.config import get_settings
from app.core.logging import setup_logging
from app.core.middleware import register_middleware
from app.services.system_monitor import system_monitor

logger = structlog.get_logger(__name__)


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI instance."""
    setup_logging()
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="AI-powered DevOps monitoring platform",
        docs_url="/docs" if settings.debug or settings.app_env != "production" else None,
        redoc_url="/redoc" if settings.debug or settings.app_env != "production" else None,
        openapi_url="/openapi.json",
    )

    register_middleware(app)
    app.include_router(api_router)
    app.include_router(root_router)

    @app.on_event("startup")
    async def startup_event() -> None:
        logger.info(
            "startup",
            app=settings.app_name,
            version=settings.app_version,
            environment=settings.app_env,
        )
        # Seed history with a first collection
        system_monitor.collect()
        # Start background metric collection loop
        asyncio.create_task(_collect_metrics_loop(settings.metrics_collection_interval))

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        logger.info("shutdown", app=settings.app_name)

    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc: Exception) -> JSONResponse:
        logger.error("unhandled_exception", exc=str(exc), path=request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return app


async def _collect_metrics_loop(interval: int) -> None:
    """Background task: collect a metrics snapshot every `interval` seconds."""
    from app.services.alert_engine import alert_engine
    while True:
        await asyncio.sleep(interval)
        try:
            snapshot = system_monitor.collect()
            alert_engine.evaluate(snapshot)
        except Exception as exc:  # noqa: BLE001
            logger.warning("metric_collection_error", error=str(exc))


app = create_app()
