"""
NeuroOps AI — Backend Tests: Health Endpoint
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check_returns_200():
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_health_check_response_shape():
    response = client.get("/api/v1/health")
    data = response.json()
    assert data["status"] == "ok"
    assert "app_name" in data
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data


def test_metrics_current_returns_200():
    response = client.get("/api/v1/metrics/current")
    assert response.status_code == 200


def test_metrics_current_has_required_fields():
    response = client.get("/api/v1/metrics/current")
    data = response.json()
    assert "cpu" in data
    assert "memory" in data
    assert "disk" in data
    assert "network" in data
    assert "processes" in data


def test_alerts_list_returns_200():
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "alerts" in data


def test_create_manual_alert():
    payload = {
        "title": "Test Alert",
        "message": "This is a test alert",
        "severity": "warning",
        "category": "manual",
    }
    response = client.post("/api/v1/alerts", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Alert"
    assert data["status"] == "active"
