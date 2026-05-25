"""
NeuroOps AI — Middleware
CORS configuration and request timing middleware.
"""
import time
import uuid
from typing import Callable

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings

logger = structlog.get_logger(__name__)


def register_middleware(app: FastAPI) -> None:
    """Register all middleware on the FastAPI application instance."""
    settings = get_settings()

    # CORS — must be registered AFTER custom middleware for correct ordering
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(RequestTimingMiddleware)


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """Log each request with method, path, status code, and elapsed time."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        response = await call_next(request)

        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            elapsed_ms=round(elapsed_ms, 2),
        )
        response.headers["X-Request-ID"] = request_id
        return response
