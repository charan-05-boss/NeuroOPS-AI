"""
NeuroOps AI — Pydantic Settings
Reads configuration from environment variables / .env file.
"""
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_env: str = "development"
    app_name: str = "NeuroOps AI"
    app_version: str = "1.0.0"
    debug: bool = False

    # Server
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # CORS — comma-separated list in env, parsed here
    cors_origins: str = (
        "http://localhost:5173,"
        "https://neuro-ops-ai.netlify.app"
    )


    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # Metrics
    metrics_history_limit: int = 100
    metrics_collection_interval: int = 3  # seconds

    # AI / Anomaly Detection
    anomaly_contamination: float = 0.1
    anomaly_min_samples: int = 20

    # Alert Thresholds
    alert_cpu_threshold: float = 85.0
    alert_memory_threshold: float = 90.0
    alert_disk_threshold: float = 90.0

    # AI Analyst Settings
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    ai_provider: str = "gemini"

    # Logging
    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()
