import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ai.tools import (
    execute_get_active_campaigns,
    execute_get_top_leaderboard,
    execute_get_campaign_details,
    execute_get_my_submissions,
)
from app.ai.vector_store import vector_store

client = TestClient(app)


def test_ai_health_endpoint():
    """Verify AI health endpoint reports provider and Qdrant connectivity."""
    response = client.get("/api/v1/ai/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "provider" in data
    assert "qdrant_connected" in data


def test_execute_get_active_campaigns_tool():
    """Verify database tool returns active campaigns without leaking private data."""
    camps = execute_get_active_campaigns(limit=3)
    assert isinstance(camps, list)
    if len(camps) > 0:
        c = camps[0]
        assert "title" in c
        assert "slug" in c
        assert "reward_per_1000_views" in c
        assert "remaining_budget" in c
        # Ensure private fields are NOT present
        assert "password" not in c
        assert "creator_id" not in c


def test_execute_get_campaign_details_tool():
    """Verify campaign details query by slug."""
    active_camps = execute_get_active_campaigns(limit=1)
    if active_camps:
        slug = active_camps[0]["slug"]
        details = execute_get_campaign_details(slug)
        assert details is not None
        assert details["slug"] == slug
        assert "allowed_rules" in details
        assert "reward_per_1000_views" in details


def test_execute_get_top_leaderboard_tool():
    """Verify leaderboard tool returns ordered clips."""
    leaderboard = execute_get_top_leaderboard(limit=5)
    assert isinstance(leaderboard, list)


def test_execute_get_my_submissions_guest():
    """Verify guest user returns error message instead of leaking data."""
    res = execute_get_my_submissions(user_id=0)
    assert len(res) == 1
    assert "error" in res[0]


@pytest.mark.asyncio
async def test_qdrant_vector_search():
    """Verify Qdrant semantic search retrieves policy chunks."""
    is_healthy = await vector_store.is_healthy()
    if is_healthy:
        # Dummy query vector
        test_vector = [0.1] * 768
        results = await vector_store.search("marketplace_policies", test_vector, limit=2)
        assert isinstance(results, list)


def test_ai_chat_streaming_endpoint():
    """Verify /api/v1/ai/chat returns SSE streaming content."""
    payload = {
        "message": "What campaigns are currently active?",
        "history": [],
    }
    response = client.post("/api/v1/ai/chat", json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    text = response.text
    assert "data: " in text
    assert '"type": "done"' in text
