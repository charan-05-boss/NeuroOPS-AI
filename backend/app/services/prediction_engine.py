"""
NeuroOps AI — Prediction Engine Service
ML-powered forecasting service using scikit-learn + pandas + numpy.

Algorithms:
  - LinearRegression + PolynomialFeatures (degree 2) per metric
  - Rolling window statistics for confidence bounds
  - Sigmoid-transformed overload probability
  - Variance + slope composite stability score
"""
import math
from typing import List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler

from app.config import get_settings
from app.models.metrics import SystemMetricsSnapshot
from app.models.predictions import (
    MetricForecast,
    PredictionResponse,
    RiskLevel,
    StabilityReport,
    TrendDirection,
)


# ── Constants ────────────────────────────────────────────────────────────────

MIN_SAMPLES = 10          # Minimum history snapshots needed
FORECAST_STEPS = 10       # Predict N steps ahead
CONFIDENCE_SIGMA = 1.5    # ±1.5σ confidence band
POLY_DEGREE = 2           # Polynomial degree for trend capture


class PredictionEngine:
    """
    Singleton service that builds short-term forecasts from the rolling
    metrics history maintained by SystemMonitor.
    """

    def __init__(self) -> None:
        self._settings = get_settings()

    # ── Public API ────────────────────────────────────────────────────────

    def predict(self, snapshots: List[SystemMetricsSnapshot]) -> PredictionResponse:
        """
        Main entry point.  Accepts the full history list and returns a
        PredictionResponse with per-metric forecasts + stability report.
        """
        n = len(snapshots)

        if n < MIN_SAMPLES:
            return PredictionResponse(
                is_model_ready=False,
                samples_used=n,
                forecast_steps=FORECAST_STEPS,
                forecast_interval_seconds=self._settings.metrics_collection_interval,
            )

        df = self._to_dataframe(snapshots)

        cpu_fc = self._forecast_metric(
            df["cpu_percent"],
            metric="cpu",
            threshold=self._settings.alert_cpu_threshold,
        )
        mem_fc = self._forecast_metric(
            df["memory_percent"],
            metric="memory",
            threshold=self._settings.alert_memory_threshold,
        )
        disk_fc = self._forecast_metric(
            df["disk_percent"],
            metric="disk",
            threshold=self._settings.alert_disk_threshold,
        )

        stability = self._compute_stability(cpu_fc, mem_fc, disk_fc)

        return PredictionResponse(
            is_model_ready=True,
            samples_used=n,
            forecast_steps=FORECAST_STEPS,
            forecast_interval_seconds=self._settings.metrics_collection_interval,
            cpu_forecast=cpu_fc,
            memory_forecast=mem_fc,
            disk_forecast=disk_fc,
            stability=stability,
            history_cpu=df["cpu_percent"].tolist(),
            history_memory=df["memory_percent"].tolist(),
        )

    # ── Private: forecasting ─────────────────────────────────────────────

    def _forecast_metric(
        self,
        series: pd.Series,
        metric: str,
        threshold: float,
    ) -> MetricForecast:
        """Fit a polynomial regression on `series` and extrapolate FORECAST_STEPS ahead."""
        values = series.values.astype(float)
        n = len(values)
        X_train = np.arange(n).reshape(-1, 1)
        y_train = values

        model = self._build_pipeline()
        model.fit(X_train, y_train)

        # Predict future steps
        X_future = np.arange(n, n + FORECAST_STEPS).reshape(-1, 1)
        predicted_raw = model.predict(X_future)
        # Clip to [0, 100] — percentages can't exceed that
        predicted = np.clip(predicted_raw, 0.0, 100.0).tolist()

        # Residuals on training set for confidence bounds
        train_residuals = y_train - model.predict(X_train)
        residual_std = float(np.std(train_residuals))

        peak = float(np.max(predicted))
        avg = float(np.mean(predicted))
        current = float(values[-1])

        # Trend slope (change per sample) from linear component
        slope = self._compute_slope(values)
        direction = self._classify_trend(slope)

        lower = max(0.0, peak - CONFIDENCE_SIGMA * residual_std)
        upper = min(100.0, peak + CONFIDENCE_SIGMA * residual_std)

        return MetricForecast(
            metric=metric,
            current_value=round(current, 2),
            predicted_values=[round(v, 2) for v in predicted],
            predicted_peak=round(peak, 2),
            predicted_avg=round(avg, 2),
            confidence_lower=round(lower, 2),
            confidence_upper=round(upper, 2),
            trend_direction=direction,
            trend_slope=round(slope, 4),
            will_exceed_threshold=upper >= threshold,
            threshold=threshold,
        )

    # ── Private: stability scoring ────────────────────────────────────────

    def _compute_stability(
        self,
        cpu: MetricForecast,
        mem: MetricForecast,
        disk: MetricForecast,
    ) -> StabilityReport:
        """
        Compute a 0–100 stability score from:
          - Predicted peak loads (weighted)
          - Trend slopes (penalise rising trends)
          - Confidence band width (wide band = high uncertainty = lower score)
        """
        # Weighted peak penalty (higher usage = lower stability)
        peak_penalty = (
            cpu.predicted_peak  * 0.45
            + mem.predicted_peak * 0.35
            + disk.predicted_peak * 0.20
        )

        # Slope penalty — only penalise rising trends
        slope_penalty = (
            max(0.0, cpu.trend_slope)  * 40.0
            + max(0.0, mem.trend_slope) * 35.0
            + max(0.0, disk.trend_slope) * 15.0
        )
        slope_penalty = min(slope_penalty, 25.0)

        # Confidence band uncertainty penalty
        band_widths = [
            cpu.confidence_upper - cpu.confidence_lower,
            mem.confidence_upper - mem.confidence_lower,
        ]
        uncertainty_penalty = min(float(np.mean(band_widths)) * 0.2, 10.0)

        raw_score = 100.0 - peak_penalty * 0.65 - slope_penalty - uncertainty_penalty
        score = max(0.0, min(100.0, raw_score))

        # Overload probability — sigmoid of how far peaks are above thresholds
        overload_signals = []
        for fc in [cpu, mem, disk]:
            excess = (fc.predicted_peak - fc.threshold) / 100.0
            overload_signals.append(self._sigmoid(excess * 10.0))
        overload_prob = round(float(np.mean(overload_signals)), 4)

        grade, risk_level, summary, factors = self._grade_stability(
            score, cpu, mem, disk, overload_prob
        )

        return StabilityReport(
            score=round(score, 1),
            grade=grade,
            risk_level=risk_level,
            overload_probability=overload_prob,
            contributing_factors=factors,
            summary=summary,
        )

    def _grade_stability(
        self,
        score: float,
        cpu: MetricForecast,
        mem: MetricForecast,
        disk: MetricForecast,
        overload_prob: float,
    ) -> Tuple[str, RiskLevel, str, List[str]]:
        factors: List[str] = []

        if cpu.trend_direction == TrendDirection.RISING:
            factors.append(f"CPU rising at {abs(cpu.trend_slope):.2f}%/sample — expected peak {cpu.predicted_peak:.1f}%")
        if mem.trend_direction == TrendDirection.RISING:
            factors.append(f"Memory climbing — forecast peak {mem.predicted_peak:.1f}% (threshold {mem.threshold}%)")
        if cpu.will_exceed_threshold:
            factors.append(f"CPU predicted to breach {cpu.threshold}% alert threshold")
        if mem.will_exceed_threshold:
            factors.append(f"RAM predicted to breach {mem.threshold}% alert threshold")
        if disk.will_exceed_threshold:
            factors.append(f"Disk usage forecasted above {disk.threshold}% critical level")
        if overload_prob > 0.6:
            factors.append(f"High overload probability ({overload_prob * 100:.0f}%) — consider scaling resources")
        if not factors:
            factors.append("All metrics within safe predicted bounds")

        if score >= 80:
            return "A", RiskLevel.LOW, "System stable — low resource pressure forecasted", factors
        elif score >= 65:
            return "B", RiskLevel.LOW, "System moderately stable — minor resource pressure ahead", factors
        elif score >= 50:
            return "C", RiskLevel.MODERATE, "Moderate instability predicted — monitor closely", factors
        elif score >= 35:
            return "D", RiskLevel.HIGH, "High instability predicted — proactive action recommended", factors
        else:
            return "F", RiskLevel.CRITICAL, "Critical overload likely — immediate intervention required", factors

    # ── Private: utilities ────────────────────────────────────────────────

    @staticmethod
    def _build_pipeline() -> Pipeline:
        """Polynomial regression pipeline with scaling."""
        return Pipeline([
            ("poly", PolynomialFeatures(degree=POLY_DEGREE, include_bias=False)),
            ("scaler", StandardScaler()),
            ("regressor", LinearRegression()),
        ])

    @staticmethod
    def _compute_slope(values: np.ndarray) -> float:
        """Simple linear slope from a least-squares fit on the last 20 values."""
        window = values[-20:]
        n = len(window)
        if n < 2:
            return 0.0
        x = np.arange(n, dtype=float)
        coeffs = np.polyfit(x, window, 1)
        return float(coeffs[0])

    @staticmethod
    def _classify_trend(slope: float) -> TrendDirection:
        if slope > 0.15:
            return TrendDirection.RISING
        elif slope < -0.15:
            return TrendDirection.FALLING
        return TrendDirection.STABLE

    @staticmethod
    def _sigmoid(x: float) -> float:
        return 1.0 / (1.0 + math.exp(-x))

    @staticmethod
    def _to_dataframe(snapshots: List[SystemMetricsSnapshot]) -> pd.DataFrame:
        return pd.DataFrame([
            {
                "timestamp": s.timestamp,
                "cpu_percent": s.cpu.percent,
                "memory_percent": s.memory.percent,
                "disk_percent": s.disk.percent,
                "bytes_sent_mb": s.network.bytes_sent_mb,
                "bytes_recv_mb": s.network.bytes_recv_mb,
            }
            for s in snapshots
        ])


# Module-level singleton
prediction_engine = PredictionEngine()
