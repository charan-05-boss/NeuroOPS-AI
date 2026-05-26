"""
NeuroOps AI — AI Analyst Service
Analyzes live system metrics using Gemini or OpenAI APIs,
falling back to a rule-based mock analyst when credentials are missing.
"""
import json
import re
from typing import Optional

import httpx
import structlog

from app.config import get_settings
from app.models.ai_analysis import AiAnalysisResponse
from app.models.metrics import SystemMetricsSnapshot

logger = structlog.get_logger(__name__)


class AIAnalyst:
    """
    Connects to external LLM providers to generate DevOps system state analyses.
    Supports OpenAI, Gemini, and a local mock fallback.
    """

    def __init__(self) -> None:
        pass

    async def analyze(
        self, snapshot: SystemMetricsSnapshot, system_info: Optional[object] = None
    ) -> AiAnalysisResponse:
        """Analyze the current metrics snapshot using the configured provider."""
        settings = get_settings()
        provider = settings.ai_provider.lower()

        # Automatically determine provider based on available keys if "gemini" or "openai" is requested
        if provider == "gemini" and not settings.gemini_api_key:
            if settings.openai_api_key:
                provider = "openai"
            else:
                provider = "mock"
        elif provider == "openai" and not settings.openai_api_key:
            if settings.gemini_api_key:
                provider = "gemini"
            else:
                provider = "mock"

        logger.info("running_ai_analysis", provider=provider)

        # Build prompt variables
        metrics_data = {
            "timestamp": str(snapshot.timestamp),
            "cpu": {
                "percent": snapshot.cpu.percent,
                "logical_cores": snapshot.cpu.count_logical,
                "frequency_mhz": snapshot.cpu.frequency_mhz,
            },
            "memory": {
                "percent": snapshot.memory.percent,
                "total_gb": snapshot.memory.total_gb,
                "used_gb": snapshot.memory.used_gb,
            },
            "disk": {
                "percent": snapshot.disk.percent,
                "total_gb": snapshot.disk.total_gb,
                "used_gb": snapshot.disk.used_gb,
                "free_gb": snapshot.disk.free_gb,
            },
            "network": {
                "bytes_sent_mb": snapshot.network.bytes_sent_mb,
                "bytes_recv_mb": snapshot.network.bytes_recv_mb,
            },
            "processes": {
                "total": snapshot.processes.total,
                "running": snapshot.processes.running,
                "sleeping": snapshot.processes.sleeping,
            },
        }

        specs_data = {}
        if system_info:
            specs_data = {
                "os": getattr(system_info, "os_name", "N/A"),
                "architecture": getattr(system_info, "architecture", "N/A"),
                "hostname": getattr(system_info, "hostname", "N/A"),
                "cpu_model": getattr(system_info, "cpu_model", "N/A"),
                "total_memory_gb": getattr(system_info, "total_memory_gb", "N/A"),
                "total_disk_gb": getattr(system_info, "total_disk_gb", "N/A"),
            }

        prompt = (
            "You are an expert DevOps AI analyst for NeuroOps AI. You are examining live system metrics.\n\n"
            f"SYSTEM SPECIFICATIONS:\n{json.dumps(specs_data, indent=2)}\n\n"
            f"LIVE SYSTEM METRICS SNAPSHOT:\n{json.dumps(metrics_data, indent=2)}\n\n"
            "Your task is to analyze these parameters and return a structured assessment.\n"
            "Return your assessment STRICTLY in the following JSON format without any enclosing markdown or pre-amble text:\n"
            "{\n"
            '  "system_state": "Brief high-level summary of CPU, RAM, disk, and network stats.",\n'
            '  "possible_issues": ["List possible bottlenecks, memory leaks, high process load, or empty if none."],\n'
            '  "suspicious_behavior": ["List indicators of suspicious system activity (e.g. process counts, network loads), or empty if none."],\n'
            '  "recommendations": ["List actionable DevOps optimizations to improve performance and security."],\n'
            '  "concise_insight": "A single-sentence operational insight (e.g., CPU is normal, but RAM usage is elevated due to Electron processes.)"\n'
            "}"
        )

        if provider == "gemini":
            try:
                key: str = settings.gemini_api_key or ""
                return await self._call_gemini(key, prompt)
            except Exception as exc:
                logger.error("gemini_api_failed_falling_back_to_mock", error=str(exc))
                return self._run_mock_analysis(snapshot, system_info)
        elif provider == "openai":
            try:
                o_key: str = settings.openai_api_key or ""
                return await self._call_openai(o_key, prompt)
            except Exception as exc:
                logger.error("openai_api_failed_falling_back_to_mock", error=str(exc))
                return self._run_mock_analysis(snapshot, system_info)
        else:
            return self._run_mock_analysis(snapshot, system_info)

    # ── API Calls ────────────────────────────────────────────────────────────

    async def _call_gemini(self, api_key: str, prompt: str) -> AiAnalysisResponse:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
            },
        }

        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

            # Parse response text
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned = self._clean_json_response(text)
            parsed = json.loads(cleaned)
            return AiAnalysisResponse(**parsed)

    async def _call_openai(self, api_key: str, prompt: str) -> AiAnalysisResponse:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a DevOps AI analyst returning JSON formatted data.",
                },
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

            text = data["choices"][0]["message"]["content"]
            cleaned = self._clean_json_response(text)
            parsed = json.loads(cleaned)
            return AiAnalysisResponse(**parsed)

    # ── Mock Analyzer Fallback ───────────────────────────────────────────────

    def _run_mock_analysis(
        self, snapshot: SystemMetricsSnapshot, system_info: Optional[object]
    ) -> AiAnalysisResponse:
        cpu = snapshot.cpu.percent
        ram = snapshot.memory.percent
        disk = snapshot.disk.percent
        net_sent = snapshot.network.bytes_sent_mb
        net_recv = snapshot.network.bytes_recv_mb
        proc_total = snapshot.processes.total
        proc_run = snapshot.processes.running

        issues = []
        suspicious = []
        recs = []

        # Analyze CPU
        if cpu >= 85.0:
            issues.append(f"High CPU utilization detected at {cpu:.1f}%.")
            recs.append("Identify CPU-intensive process tasks via process list and terminate them.")
        elif cpu >= 70.0:
            issues.append(f"Moderate CPU utilization detected at {cpu:.1f}%.")
            recs.append("Monitor logical thread load distribution to ensure core balance.")

        # Analyze RAM
        if ram >= 90.0:
            issues.append(f"Critical RAM utilization detected at {ram:.1f}%.")
            recs.append("Memory resources depleted; clear inactive application tasks or upgrade node memory.")
        elif ram >= 80.0:
            issues.append(f"Elevated RAM utilization detected at {ram:.1f}%.")
            recs.append("Identify memory leaks or heavy instances (e.g. excess browser threads, build runners).")

        # Analyze Disk
        if disk >= 90.0:
            issues.append(f"Critical disk storage utilization detected at {disk:.1f}%.")
            recs.append("Purge temporary log files, node cache, and build directory artifacts to free space.")
        elif disk >= 80.0:
            issues.append(f"Elevated disk storage utilization detected at {disk:.1f}%.")
            recs.append("Monitor database growth rate and clean old archive log files.")

        # Active processes ratio
        if proc_run > 10:
            suspicious.append(f"High active running process count ({proc_run}) relative to overall process pool ({proc_total}).")
            recs.append("Check for process leakage, thread loops, or zombie background workers.")

        # Network anomalous traffic
        if net_sent > 100 or net_recv > 100:
            suspicious.append(f"Anomalous high network traffic (Sent: {net_sent:.1f} MB, Recv: {net_recv:.1f} MB).")
            recs.append("Audit network sockets to verify if unauthorized uploads or request loops are active.")

        # Summary states
        cores = getattr(system_info, "cpu_cores_logical", 4) if system_info else 4
        os_platform = getattr(system_info, "os_name", "macOS") if system_info else "macOS"

        state = f"System is operating on {os_platform} with {cores} logical cores. CPU: {cpu:.1f}%, RAM: {ram:.1f}%, Disk: {disk:.1f}%."

        if not issues and not suspicious:
            recs = [
                "Schedule routine checkups and system maintenance tasks.",
                "Ensure automatic OS updates and package registry upgrades are active.",
            ]
            insight = "System performance is fully optimal. Core parameters indicate low load and high stability."
        else:
            insight_parts = []
            if cpu >= 85.0:
                insight_parts.append("CPU load is critical")
            if ram >= 80.0:
                insight_parts.append("RAM usage is elevated")
            if disk >= 90.0:
                insight_parts.append("Disk space is depleted")
            if proc_run > 10 or net_sent > 100 or net_recv > 100:
                insight_parts.append("anomalous activities detected")

            insight = f"System parameters flag issues: {', '.join(insight_parts)}."
            insight = insight.replace("  ", " ").replace("issues: .", "potential bottlenecks.")

        return AiAnalysisResponse(
            system_state=state,
            possible_issues=issues,
            suspicious_behavior=suspicious,
            recommendations=recs,
            concise_insight=insight,
        )

    @staticmethod
    def _clean_json_response(text: str) -> str:
        text = text.strip()
        # Find json block using regex to avoid preamble issues
        match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
        if match:
            return match.group(1).strip()

        # Handle potential leading/trailing quotes or brackets
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()


    async def chat(
        self,
        message: str,
        chat_history: list,
        snapshot: SystemMetricsSnapshot,
        system_info: Optional[object] = None,
    ) -> str:
        """Interact with the DevOps assistant about current metrics."""
        settings = get_settings()
        provider = settings.ai_provider.lower()

        if provider == "gemini" and not settings.gemini_api_key:
            provider = "openai" if settings.openai_api_key else "mock"
        elif provider == "openai" and not settings.openai_api_key:
            provider = "gemini" if settings.gemini_api_key else "mock"

        # Build prompt context
        metrics_summary = (
            f"CPU percent: {snapshot.cpu.percent}%, "
            f"RAM percent: {snapshot.memory.percent}%, "
            f"Disk percent: {snapshot.disk.percent}%, "
            f"Active processes: {snapshot.processes.running}/{snapshot.processes.total}, "
            f"Network Sent/Recv: {snapshot.network.bytes_sent_mb:.2f}/{snapshot.network.bytes_recv_mb:.2f} MB"
        )
        
        system_specs = ""
        if system_info:
            system_specs = (
                f"OS: {getattr(system_info, 'os_name', 'N/A')}, "
                f"CPU: {getattr(system_info, 'cpu_model', 'N/A')}, "
                f"RAM: {getattr(system_info, 'total_memory_gb', 'N/A')} GB, "
                f"Disk: {getattr(system_info, 'total_disk_gb', 'N/A')} GB"
            )

        system_instruction = (
            "You are 'NeuroOps AI Copilot', an expert DevOps and SRE assistant.\n"
            "You help developers understand system diagnostics, find performance problems, and secure nodes.\n"
            "Here is the current real-time system state you are analyzing:\n"
            f"System specs: {system_specs}\n"
            f"Metrics snapshot: {metrics_summary}\n\n"
            "Be helpful, technical, concise, and structured. Do not repeat this background info in your responses unless asked. Speak in a helpful direct manner."
        )

        if provider == "gemini":
            try:
                # Format conversation history for Gemini API
                contents = []
                # System instruction
                contents.append({"role": "user", "parts": [{"text": system_instruction}]})
                contents.append({"role": "model", "parts": [{"text": "Understood. Ready to assist with system analysis."}]})
                for msg in chat_history:
                    role = "user" if msg["role"] == "user" else "model"
                    contents.append({
                        "role": role,
                        "parts": [{"text": msg["content"]}]
                    })
                contents.append({
                    "role": "user",
                    "parts": [{"text": message}]
                })
                
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={settings.gemini_api_key}"
                payload = {"contents": contents}
                
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(url, json=payload)
                    response.raise_for_status()
                    data = response.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as exc:
                logger.error("gemini_chat_failed_falling_back_to_mock", error=str(exc))
                return self._run_mock_chat(message, snapshot)

        elif provider == "openai":
            try:
                messages = [{"role": "system", "content": system_instruction}]
                for msg in chat_history:
                    messages.append({"role": msg["role"], "content": msg["content"]})
                messages.append({"role": "user", "content": message})
                
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}
                o_payload: dict[str, object] = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                }
                
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(url, headers=headers, json=o_payload)
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as exc:
                logger.error("openai_chat_failed_falling_back_to_mock", error=str(exc))
                return self._run_mock_chat(message, snapshot)
        else:
            return self._run_mock_chat(message, snapshot)

    def _run_mock_chat(self, message: str, snapshot: SystemMetricsSnapshot) -> str:
        msg = message.lower()
        if "cpu" in msg:
            return f"The current CPU load is {snapshot.cpu.percent:.1f}%. If this number spikes, make sure there are no infinite process loops or rogue child threads."
        if "memory" in msg or "ram" in msg:
            return f"Virtual memory usage stands at {snapshot.memory.percent:.1f}%. Out of {snapshot.memory.total_gb:.1f} GB, {snapshot.memory.used_gb:.1f} GB is currently occupied."
        if "disk" in msg:
            return f"The root mount point '/' disk space usage is {snapshot.disk.percent:.1f}%. You have {snapshot.disk.free_gb:.1f} GB free."
        if "network" in msg or "traffic" in msg:
            return f"Network traffic: Sent {snapshot.network.bytes_sent_mb:.2f} MB, Received {snapshot.network.bytes_recv_mb:.2f} MB."
        if "uptime" in msg:
            return "To check system uptime details, run standard `uptime` commands or refer to the specifications cards in the Dashboard overview."
        return "I am the NeuroOps Mock Chatbot. In production, I would use the Gemini or OpenAI API key to answer your custom prompts. Let me know if you want to know about CPU, RAM, Disk, or Network metrics!"


# Module-level singleton
ai_analyst = AIAnalyst()
