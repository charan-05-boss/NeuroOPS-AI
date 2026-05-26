"""
NeuroOps AI — Root System Info Endpoint
GET /system-info — Details about OS, python, and system hardware
"""
from datetime import datetime, timezone
import platform
import socket
import subprocess
import time

from fastapi import APIRouter, HTTPException
import psutil

from app.models.system_info import SystemInfoResponse
from monitor.formatters import format_uptime

router = APIRouter(tags=["System Info"])


def get_cpu_model() -> str:
    """Retrieve a detailed CPU brand/model name string on different OS platforms."""
    system = platform.system()
    try:
        if system == "Darwin":
            # On macOS, get the brand string via sysctl
            proc = subprocess.run(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                capture_output=True,
                text=True,
                check=False
            )
            brand = proc.stdout.strip()
            if brand:
                return brand
            
            # Fallback to model name
            proc = subprocess.run(
                ["sysctl", "-n", "hw.model"],
                capture_output=True,
                text=True,
                check=False
            )
            model = proc.stdout.strip()
            if model:
                return model

        elif system == "Linux":
            # On Linux, parse cpuinfo
            with open("/proc/cpuinfo", "r") as f:
                for line in f:
                    if "model name" in line:
                        return line.split(":", 1)[1].strip()

        elif system == "Windows":
            # On Windows, read registry key
            import winreg # type: ignore
            key = winreg.OpenKey( # type: ignore
                winreg.HKEY_LOCAL_MACHINE, # type: ignore
                r"HARDWARE\DESCRIPTION\System\CentralProcessor\0"
            )
            brand, _ = winreg.QueryValueEx(key, "ProcessorNameString") # type: ignore
            if brand:
                return brand.strip()
    except Exception:  # noqa: BLE001
        pass

    # Generic fallback
    return platform.processor() or platform.machine() or "Unknown CPU"


@router.get("/system-info", response_model=SystemInfoResponse, summary="Retrieve system info")
async def get_system_info() -> SystemInfoResponse:
    """
    Returns detailed system specifications, hardware configuration, and uptime.
    """
    try:
        boot_timestamp = psutil.boot_time()
        uptime_seconds = time.time() - boot_timestamp
        uptime_str = format_uptime(uptime_seconds)

        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        logical_cores = psutil.cpu_count(logical=True) or 1
        physical_cores = psutil.cpu_count(logical=False) or 1

        return SystemInfoResponse(
            os_name=platform.system(),
            os_release=platform.release(),
            os_version=platform.version(),
            architecture=platform.machine(),
            hostname=socket.gethostname(),
            python_version=platform.python_version(),
            cpu_model=get_cpu_model(),
            cpu_cores_logical=logical_cores,
            cpu_cores_physical=physical_cores,
            total_memory_gb=round(mem.total / (1024 ** 3), 2),
            total_disk_gb=round(disk.total / (1024 ** 3), 2),
            boot_time=datetime.fromtimestamp(boot_timestamp, tz=timezone.utc),
            uptime=uptime_str,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to gather system information: {str(exc)}"
        )
