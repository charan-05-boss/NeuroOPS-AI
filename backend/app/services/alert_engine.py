"""
NeuroOps AI — Alert Engine Service
Rule-based alerting that evaluates the latest metrics snapshot against
configurable thresholds and emits structured Alert objects.
"""
from collections import deque
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from app.config import get_settings
from app.models.alerts import (
    Alert,
    AlertCategory,
    AlertCreateRequest,
    AlertListResponse,
    AlertSeverity,
    AlertStatus,
)
from app.models.metrics import SystemMetricsSnapshot


import structlog
from app.config import get_settings
from app.models.alerts import (
    Alert,
    AlertCategory,
    AlertCreateRequest,
    AlertListResponse,
    AlertSeverity,
    AlertStatus,
)
from app.models.metrics import SystemMetricsSnapshot

logger = structlog.get_logger(__name__)


class AlertEngine:
    """
    Maintains an in-memory alert store and evaluates threshold rules.
    In production this would be backed by a database.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._cpu_threshold = settings.alert_cpu_threshold
        self._memory_threshold = settings.alert_memory_threshold
        self._disk_threshold = settings.alert_disk_threshold
        self._alerts: Dict[UUID, Alert] = {}

    # ── Evaluation ──────────────────────────────────────────────────────────

    def evaluate(self, snapshot: SystemMetricsSnapshot) -> List[Alert]:
        """Check snapshot against thresholds and anomaly logs. Creates or resolves alerts."""
        new_alerts: List[Alert] = []

        # 1. CPU Threshold Check
        cpu_val = snapshot.cpu.percent
        if cpu_val >= 95.0:
            # Upgrade warning to critical or create critical
            self._resolve_active_alert_by_severity(AlertCategory.CPU, AlertSeverity.WARNING)
            if not self._has_active_alert(AlertCategory.CPU, AlertSeverity.CRITICAL):
                alert = self._create_system_alert(
                    title="Critical CPU Usage",
                    message=f"CPU usage is critically high at {cpu_val:.1f}% (threshold 95%)",
                    severity=AlertSeverity.CRITICAL,
                    category=AlertCategory.CPU,
                    value=cpu_val,
                    threshold=95.0
                )
                new_alerts.append(alert)
        elif cpu_val >= self._cpu_threshold:
            # Create warning (if not already active at critical or warning)
            if not self._has_active_alert(AlertCategory.CPU, AlertSeverity.WARNING) and not self._has_active_alert(AlertCategory.CPU, AlertSeverity.CRITICAL):
                alert = self._create_system_alert(
                    title="High CPU Warning",
                    message=f"CPU usage is elevated at {cpu_val:.1f}% (threshold {self._cpu_threshold:.1f}%)",
                    severity=AlertSeverity.WARNING,
                    category=AlertCategory.CPU,
                    value=cpu_val,
                    threshold=self._cpu_threshold
                )
                new_alerts.append(alert)
        else:
            # Below warnings: clear all active CPU alerts
            self._resolve_active_alerts(AlertCategory.CPU)

        # 2. RAM (Memory) Threshold Check
        ram_val = snapshot.memory.percent
        if ram_val >= self._memory_threshold:
            # RAM threshold is 90% -> critical
            self._resolve_active_alert_by_severity(AlertCategory.MEMORY, AlertSeverity.WARNING)
            if not self._has_active_alert(AlertCategory.MEMORY, AlertSeverity.CRITICAL):
                alert = self._create_system_alert(
                    title="Critical Memory Usage",
                    message=f"Memory usage is critically high at {ram_val:.1f}% (threshold {self._memory_threshold:.1f}%)",
                    severity=AlertSeverity.CRITICAL,
                    category=AlertCategory.MEMORY,
                    value=ram_val,
                    threshold=self._memory_threshold
                )
                new_alerts.append(alert)
        elif ram_val >= 80.0:
            # Memory warning threshold 80%
            if not self._has_active_alert(AlertCategory.MEMORY, AlertSeverity.WARNING) and not self._has_active_alert(AlertCategory.MEMORY, AlertSeverity.CRITICAL):
                alert = self._create_system_alert(
                    title="High Memory Warning",
                    message=f"Memory usage is elevated at {ram_val:.1f}% (threshold 80%)",
                    severity=AlertSeverity.WARNING,
                    category=AlertCategory.MEMORY,
                    value=ram_val,
                    threshold=80.0
                )
                new_alerts.append(alert)
        else:
            self._resolve_active_alerts(AlertCategory.MEMORY)

        # 3. Disk Threshold Check
        disk_val = snapshot.disk.percent
        if disk_val >= self._disk_threshold:
            # Disk threshold is 90% -> critical
            self._resolve_active_alert_by_severity(AlertCategory.DISK, AlertSeverity.WARNING)
            if not self._has_active_alert(AlertCategory.DISK, AlertSeverity.CRITICAL):
                alert = self._create_system_alert(
                    title="Critical Disk Usage",
                    message=f"Disk space usage is critically high at {disk_val:.1f}% (threshold {self._disk_threshold:.1f}%)",
                    severity=AlertSeverity.CRITICAL,
                    category=AlertCategory.DISK,
                    value=disk_val,
                    threshold=self._disk_threshold
                )
                new_alerts.append(alert)
        elif disk_val >= 80.0:
            if not self._has_active_alert(AlertCategory.DISK, AlertSeverity.WARNING) and not self._has_active_alert(AlertCategory.DISK, AlertSeverity.CRITICAL):
                alert = self._create_system_alert(
                    title="High Disk Warning",
                    message=f"Disk space usage is elevated at {disk_val:.1f}% (threshold 80%)",
                    severity=AlertSeverity.WARNING,
                    category=AlertCategory.DISK,
                    value=disk_val,
                    threshold=80.0
                )
                new_alerts.append(alert)
        else:
            self._resolve_active_alerts(AlertCategory.DISK)

        # 4. Anomaly Spike Detection
        try:
            from app.services.system_monitor import system_monitor
            from app.services.anomaly_detector import anomaly_detector
            history = system_monitor.get_history()
            if len(history) >= 20:
                anomaly_res = anomaly_detector.detect(history)
                if anomaly_res.is_model_trained and anomaly_res.points:
                    latest_point = anomaly_res.points[-1]
                    if latest_point.is_anomaly:
                        if not self._has_active_alert(AlertCategory.ANOMALY, AlertSeverity.ANOMALY):
                            alert = self._create_system_alert(
                                title="Abnormal System Spike",
                                message=f"Anomaly detected in system patterns (score: {latest_point.anomaly_score:.3f}). Type: {latest_point.anomaly_type or 'multivariate'}",
                                severity=AlertSeverity.ANOMALY,
                                category=AlertCategory.ANOMALY,
                                value=latest_point.anomaly_score,
                                threshold=-0.5
                            )
                            new_alerts.append(alert)
                    else:
                        self._resolve_active_alerts(AlertCategory.ANOMALY)
        except Exception as exc:
            logger.warning("anomaly_alert_eval_failed", error=str(exc))

        return new_alerts

    # ── CRUD ────────────────────────────────────────────────────────────────

    def create(self, req: AlertCreateRequest) -> Alert:
        alert = Alert(
            title=req.title,
            message=req.message,
            severity=req.severity,
            category=req.category,
        )
        self._alerts[alert.id] = alert
        logger.info("manual_alert_created", id=str(alert.id), title=alert.title)
        return alert

    def list_alerts(self) -> AlertListResponse:
        all_alerts = sorted(
            self._alerts.values(), key=lambda a: a.created_at, reverse=True
        )
        active = sum(1 for a in all_alerts if a.status == AlertStatus.ACTIVE)
        return AlertListResponse(total=len(all_alerts), active=active, alerts=all_alerts)

    def dismiss(self, alert_id: UUID) -> Optional[Alert]:
        alert = self._alerts.get(alert_id)
        if alert:
            alert.status = AlertStatus.RESOLVED
            alert.resolved_at = datetime.utcnow()
            logger.info("alert_dismissed", id=str(alert_id), title=alert.title)
        return alert

    # ── Helpers ─────────────────────────────────────────────────────────────

    def _create_system_alert(
        self,
        title: str,
        message: str,
        severity: AlertSeverity,
        category: AlertCategory,
        value: float,
        threshold: float,
    ) -> Alert:
        alert = Alert(
            title=title,
            message=message,
            severity=severity,
            category=category,
            metric_value=value,
            threshold=threshold,
        )
        self._alerts[alert.id] = alert
        logger.warn(
            "system_alert_triggered",
            id=str(alert.id),
            title=alert.title,
            severity=severity.value,
            category=category.value,
            metric_value=value,
            threshold=threshold,
        )
        return alert

    def _has_active_alert(
        self, category: AlertCategory, severity: Optional[AlertSeverity] = None
    ) -> bool:
        return any(
            a.category == category
            and (severity is None or a.severity == severity)
            and a.status == AlertStatus.ACTIVE
            for a in self._alerts.values()
        )

    def _resolve_active_alerts(self, category: AlertCategory) -> None:
        for alert in self._alerts.values():
            if alert.category == category and alert.status == AlertStatus.ACTIVE:
                alert.status = AlertStatus.RESOLVED
                alert.resolved_at = datetime.utcnow()
                logger.info(
                    "system_alert_resolved",
                    id=str(alert.id),
                    title=alert.title,
                    category=category.value,
                )

    def _resolve_active_alert_by_severity(
        self, category: AlertCategory, severity: AlertSeverity
    ) -> None:
        for alert in self._alerts.values():
            if (
                alert.category == category
                and alert.severity == severity
                and alert.status == AlertStatus.ACTIVE
            ):
                alert.status = AlertStatus.RESOLVED
                alert.resolved_at = datetime.utcnow()
                logger.info(
                    "system_alert_severity_resolved",
                    id=str(alert.id),
                    title=alert.title,
                    category=category.value,
                    severity=severity.value,
                )


# Module-level singleton
alert_engine = AlertEngine()
