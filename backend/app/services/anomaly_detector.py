"""
NeuroOps AI — Anomaly Detector Service
Uses sklearn's Isolation Forest on rolling metric history to flag anomalies
without requiring labeled data (unsupervised).
"""
from datetime import datetime
from typing import List, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from app.config import get_settings
from app.models.analytics import AnomalyDetectionResult, AnomalyPoint, AnomalyType
from app.models.metrics import SystemMetricsSnapshot


class AnomalyDetector:
    """
    Wraps sklearn IsolationForest to detect anomalies in system metric history.
    Requires at least `anomaly_min_samples` snapshots to train.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._contamination = settings.anomaly_contamination
        self._min_samples = settings.anomaly_min_samples
        self._model: Optional[IsolationForest] = None

    def detect(self, snapshots: List[SystemMetricsSnapshot]) -> AnomalyDetectionResult:
        """Run anomaly detection on a list of snapshots. Returns full result."""
        if len(snapshots) < self._min_samples:
            return AnomalyDetectionResult(
                is_model_trained=False,
                samples_used=len(snapshots),
                anomalies_detected=0,
                anomaly_rate=0.0,
                points=[],
            )

        df = self._snapshots_to_df(snapshots)
        features = df[["cpu_percent", "memory_percent", "disk_percent"]].values

        self._model = IsolationForest(
            contamination=self._contamination,
            random_state=42,
            n_estimators=100,
        )
        predictions = self._model.fit_predict(features)  # 1=normal, -1=anomaly
        scores = self._model.score_samples(features)      # more negative = more anomalous

        points = []
        for i, (snap, pred, score) in enumerate(zip(snapshots, predictions, scores)):
            is_anomaly = pred == -1
            points.append(
                AnomalyPoint(
                    timestamp=snap.timestamp,
                    anomaly_score=float(score),
                    is_anomaly=is_anomaly,
                    anomaly_type=self._classify_anomaly(snap) if is_anomaly else None,
                    cpu_percent=snap.cpu.percent,
                    memory_percent=snap.memory.percent,
                    disk_percent=snap.disk.percent,
                )
            )

        anomalies_detected = sum(1 for p in points if p.is_anomaly)
        return AnomalyDetectionResult(
            is_model_trained=True,
            samples_used=len(snapshots),
            anomalies_detected=anomalies_detected,
            anomaly_rate=round(anomalies_detected / len(snapshots), 4),
            points=points,
        )

    # ── Private helpers ─────────────────────────────────────────────────────

    @staticmethod
    def _snapshots_to_df(snapshots: List[SystemMetricsSnapshot]) -> pd.DataFrame:
        rows = [
            {
                "timestamp": s.timestamp,
                "cpu_percent": s.cpu.percent,
                "memory_percent": s.memory.percent,
                "disk_percent": s.disk.percent,
                "bytes_sent_mb": s.network.bytes_sent_mb,
                "bytes_recv_mb": s.network.bytes_recv_mb,
            }
            for s in snapshots
        ]
        return pd.DataFrame(rows)

    @staticmethod
    def _classify_anomaly(snap: SystemMetricsSnapshot) -> AnomalyType:
        """Heuristic: assign the dominant anomaly type based on which metric is highest."""
        scores = {
            AnomalyType.CPU_SPIKE: snap.cpu.percent,
            AnomalyType.MEMORY_LEAK: snap.memory.percent,
            AnomalyType.DISK_SURGE: snap.disk.percent,
        }
        return max(scores, key=lambda k: scores[k])


# Module-level singleton
anomaly_detector = AnomalyDetector()
