"""
NeuroOps AI — Chat Endpoint
POST /api/v1/chat — Context-rich conversational AI assistant.

Injects live metrics, active alerts, and ML prediction state into
the system prompt so the LLM can answer operational questions with
full situational awareness.
"""
import json
from typing import Annotated, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.dependencies import get_alert_engine, get_prediction_engine, get_system_monitor
from app.services.ai_analyst import ai_analyst
from app.services.alert_engine import AlertEngine
from app.services.prediction_engine import PredictionEngine
from app.services.system_monitor import SystemMonitor
from app.api.endpoints.system_info import get_system_info

router = APIRouter(prefix="/chat", tags=["Chat"])


# ── Request / Response schemas ────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: List[ChatMessage] = Field(default_factory=list, max_length=40)


class ChatResponse(BaseModel):
    response: str
    context_used: List[str] = Field(
        default_factory=list,
        description="Which context sources were injected (metrics, alerts, predictions)",
    )


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ChatResponse,
    summary="Context-aware AI Ops chat",
)
async def chat(
    payload: ChatRequest,
    monitor: Annotated[SystemMonitor, Depends(get_system_monitor)],
    alert_engine: Annotated[AlertEngine, Depends(get_alert_engine)],
    pred_engine: Annotated[PredictionEngine, Depends(get_prediction_engine)],
) -> ChatResponse:
    """
    Full-context conversational endpoint.  Gathers:
      - Live system metrics snapshot
      - Active & recent alerts
      - ML prediction state (trend direction, stability score, overload risk)
      - System hardware specs
    and weaves them into the LLM system prompt before answering.
    """
    context_used: list[str] = []

    # ── 1. Live metrics ──
    snapshot = monitor.get_current()
    context_used.append("live_metrics")

    # ── 2. System specs ──
    try:
        sys_info = await get_system_info()
    except Exception:
        sys_info = None

    # ── 3. Alerts context ──
    alert_ctx = ""
    try:
        alert_list = alert_engine.list_alerts()
        active = [a for a in alert_list.alerts if a.status == "active"]
        if active:
            alert_lines = [
                f"  • [{a.severity.upper()}] {a.title}: {a.message}"
                for a in active[:5]
            ]
            alert_ctx = "ACTIVE ALERTS:\n" + "\n".join(alert_lines)
            context_used.append("alerts")
    except Exception:
        pass

    # ── 4. Prediction / stability context ──
    pred_ctx = ""
    try:
        history = monitor.get_history()
        pred = pred_engine.predict(history)
        if pred.is_model_ready and pred.stability:
            s = pred.stability
            lines = [
                f"  Stability score: {s.score:.0f}/100 (Grade {s.grade})",
                f"  Risk level: {s.risk_level}",
                f"  Overload probability: {s.overload_probability * 100:.0f}%",
                f"  Summary: {s.summary}",
            ]
            if pred.cpu_forecast:
                lines.append(
                    f"  CPU trend: {pred.cpu_forecast.trend_direction} "
                    f"(predicted peak {pred.cpu_forecast.predicted_peak:.1f}%)"
                )
            if pred.memory_forecast:
                lines.append(
                    f"  RAM trend: {pred.memory_forecast.trend_direction} "
                    f"(predicted peak {pred.memory_forecast.predicted_peak:.1f}%)"
                )
            pred_ctx = "ML PREDICTION STATE:\n" + "\n".join(lines)
            context_used.append("predictions")
    except Exception:
        pass

    # ── 5. Build enriched system prompt ──
    metrics = snapshot
    specs_str = ""
    if sys_info:
        specs_str = (
            f"OS: {getattr(sys_info, 'os_name', 'N/A')}, "
            f"CPU: {getattr(sys_info, 'cpu_model', 'N/A')}, "
            f"Cores: {getattr(sys_info, 'cpu_cores_logical', 'N/A')}, "
            f"RAM: {getattr(sys_info, 'total_memory_gb', 'N/A')} GB"
        )

    metrics_str = json.dumps({
        "cpu_percent": metrics.cpu.percent,
        "memory_percent": metrics.memory.percent,
        "memory_used_gb": metrics.memory.used_gb,
        "memory_total_gb": metrics.memory.total_gb,
        "disk_percent": metrics.disk.percent,
        "disk_free_gb": metrics.disk.free_gb,
        "net_sent_mb": metrics.network.bytes_sent_mb,
        "net_recv_mb": metrics.network.bytes_recv_mb,
        "processes_total": metrics.processes.total,
        "processes_running": metrics.processes.running,
    }, indent=2)

    system_prompt_parts = [
        "You are 'NeuroOps Copilot' — an expert AI SRE and DevOps assistant embedded in the NeuroOps AI monitoring platform.",
        "You answer questions about system performance, alerts, anomalies, and operational optimizations.",
        "You have direct access to live telemetry, alert history, and ML-generated predictions shown below.",
        "Always ground your answers in the actual data provided. Be concise, technical, and actionable.",
        "Use bullet points for lists. Keep responses under 300 words unless detail is explicitly requested.",
        "",
        f"HARDWARE SPECS: {specs_str}",
        "",
        f"LIVE METRICS SNAPSHOT:\n{metrics_str}",
    ]
    if alert_ctx:
        system_prompt_parts += ["", alert_ctx]
    if pred_ctx:
        system_prompt_parts += ["", pred_ctx]

    system_prompt = "\n".join(system_prompt_parts)

    # ── 6. Delegate to ai_analyst.chat with enriched prompt ──
    history_dicts = [{"role": m.role, "content": m.content} for m in payload.history]

    # Temporarily patch the system instruction into a custom chat call
    response_text = await _chat_with_custom_prompt(
        system_prompt=system_prompt,
        message=payload.message,
        history=history_dicts,
        snapshot=snapshot,
    )

    return ChatResponse(response=response_text, context_used=context_used)


async def _chat_with_custom_prompt(
    system_prompt: str,
    message: str,
    history: list,
    snapshot,
) -> str:
    """Call the appropriate LLM with a fully custom system prompt."""
    from app.config import get_settings
    import httpx
    import structlog

    log = structlog.get_logger(__name__)
    settings = get_settings()
    provider = settings.ai_provider.lower()

    if provider == "gemini" and not settings.gemini_api_key:
        provider = "openai" if settings.openai_api_key else "mock"
    elif provider == "openai" and not settings.openai_api_key:
        provider = "gemini" if settings.gemini_api_key else "mock"

    if provider == "gemini":
        try:
            contents = [
                {"role": "user",  "parts": [{"text": system_prompt}]},
                {"role": "model", "parts": [{"text": "Understood. I have full situational awareness of this system. Ready to assist."}]},
            ]
            for msg in history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg["content"]}]})
            contents.append({"role": "user", "parts": [{"text": message}]})

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.gemini_api_key}"
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, json={"contents": contents})
                resp.raise_for_status()
                return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as exc:
            log.error("gemini_chat_error", error=str(exc))

    elif provider == "openai":
        try:
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": message})

            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, headers=headers, json={"model": "gpt-4o-mini", "messages": messages})
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
        except Exception as exc:
            log.error("openai_chat_error", error=str(exc))

    # ── Mock fallback with full context awareness ──
    return ai_analyst._run_mock_chat(message, snapshot)
