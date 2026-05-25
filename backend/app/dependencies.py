"""
NeuroOps AI — FastAPI Dependencies
Provides singleton service instances as FastAPI dependencies.
"""
from app.services.alert_engine import alert_engine as _alert_engine
from app.services.anomaly_detector import anomaly_detector as _anomaly_detector
from app.services.prediction_engine import prediction_engine as _prediction_engine
from app.services.system_monitor import system_monitor as _system_monitor
from monitor import MonitorService

_monitor_service = MonitorService(cpu_interval=0.1)


def get_system_monitor():
    return _system_monitor


def get_anomaly_detector():
    return _anomaly_detector


def get_alert_engine():
    return _alert_engine


def get_prediction_engine():
    """Dependency provider for the ML prediction engine singleton."""
    return _prediction_engine


def get_monitor_service() -> MonitorService:
    """Dependency provider for the standalone MonitorService."""
    return _monitor_service

