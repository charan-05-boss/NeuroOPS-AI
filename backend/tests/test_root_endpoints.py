"""
NeuroOps AI — Backend Tests: Root Level Endpoints
Tests for GET /health, GET /metrics, and GET /system-info
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_health_endpoint():
    """Verify that GET /health is accessible and returns the correct schema."""
    response = client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "ok"
    assert "app_name" in data
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data


def test_root_metrics_endpoint():
    """Verify that GET /metrics is accessible and returns the flat live metrics structure."""
    response = client.get("/metrics")
    assert response.status_code == 200
    
    data = response.json()
    required_keys = {"cpu", "ram", "disk", "network_sent", "network_received", "uptime"}
    assert set(data.keys()) == required_keys
    
    # Assert values are of expected types
    assert isinstance(data["cpu"], (int, float))
    assert isinstance(data["ram"], (int, float))
    assert isinstance(data["disk"], (int, float))
    assert isinstance(data["network_sent"], int)
    assert isinstance(data["network_received"], int)
    assert isinstance(data["uptime"], str)


def test_root_system_info_endpoint():
    """Verify that GET /system-info is accessible and returns the system hardware configuration."""
    response = client.get("/system-info")
    assert response.status_code == 200
    
    data = response.json()
    required_keys = {
        "os_name",
        "os_release",
        "os_version",
        "architecture",
        "hostname",
        "python_version",
        "cpu_model",
        "cpu_cores_logical",
        "cpu_cores_physical",
        "total_memory_gb",
        "total_disk_gb",
        "boot_time",
        "uptime",
    }
    for key in required_keys:
        assert key in data, f"Key '{key}' missing from /system-info response"
        
    assert isinstance(data["os_name"], str)
    assert isinstance(data["hostname"], str)
    assert isinstance(data["cpu_cores_logical"], int)
    assert isinstance(data["total_memory_gb"], (int, float))
    assert data["total_memory_gb"] > 0
    assert data["total_disk_gb"] > 0
