import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ["healthy", "degraded"]


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "1.0.0"


def test_list_campaigns_discover():
    response = client.get("/api/v1/campaigns?size=5")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 1


def test_admin_login():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@campaignmarketplace.com", "password": "AdminSecretPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "superadmin" in data["roles"]


def test_get_current_user_profile_me():
    # Login as seeded creator with profile
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "creator@apexvisuals.com", "password": "CreatorPass123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Call /auth/me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "creator@apexvisuals.com"
    assert me_data["profile"] is not None
    assert me_data["profile"]["country"] == "Canada"


def test_editor_applications_includes_campaign():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.editor@viralclips.io", "password": "EditorPass123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    apps_res = client.get(
        "/api/v1/applications/my",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert apps_res.status_code == 200
    apps_data = apps_res.json()
    assert isinstance(apps_data, list)
    if len(apps_data) > 0:
        app0 = apps_data[0]
        assert "campaign" in app0
        assert app0["campaign"] is not None
        assert "title" in app0["campaign"]
        assert len(app0["campaign"]["title"]) > 0


def test_submission_schema_optional_campaign_id():
    from app.schemas.submission import SubmissionCreate
    obj = SubmissionCreate(youtube_url="https://www.youtube.com/watch?v=uEeZdVYu7AA")
    assert obj.campaign_id is None
    assert obj.youtube_url == "https://www.youtube.com/watch?v=uEeZdVYu7AA"


def test_get_top_clips():
    res = client.get("/api/v1/submissions/top?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) >= 2:
        assert data[0]["current_views"] >= data[1]["current_views"]
