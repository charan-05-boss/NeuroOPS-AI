"""
NeuroOps AI — Backend Tests: AI Analyst Endpoint
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ai_analysis_endpoint_returns_200():
    response = client.get("/ai-analysis")
    assert response.status_code == 200


def test_ai_analysis_response_structure():
    response = client.get("/ai-analysis")
    assert response.status_code == 200
    data = response.json()
    
    assert "system_state" in data
    assert isinstance(data["system_state"], str)
    
    assert "possible_issues" in data
    assert isinstance(data["possible_issues"], list)
    
    assert "suspicious_behavior" in data
    assert isinstance(data["suspicious_behavior"], list)
    
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)
    
    assert "concise_insight" in data
    assert isinstance(data["concise_insight"], str)


def test_mock_analyst_rules_under_normal_load():
    # Since the mock analyzer evaluates psutil live metrics, the test environment 
    # will run mock analysis on the runner container's current state. 
    response = client.get("/ai-analysis")
    assert response.status_code == 200
    data = response.json()
    
    # Verify that all returned fields are populated (even as empty arrays)
    assert len(data["system_state"]) > 0
    assert len(data["concise_insight"]) > 0
