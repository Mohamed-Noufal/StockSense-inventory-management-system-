import pytest
from fastapi.testclient import TestClient

def test_login_success(client: TestClient):
    resp = client.post("/api/v1/auth/login", json={
        "email": "john.doe@stocksense.oilfield",
        "password": "stocksense123"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "john.doe@stocksense.oilfield"
    assert data["user"]["role"] == "STOREKEEPER"

def test_login_invalid_password(client: TestClient):
    resp = client.post("/api/v1/auth/login", json={
        "email": "john.doe@stocksense.oilfield",
        "password": "wrongpassword"
    })
    assert resp.status_code == 401
    assert "Invalid credentials" in resp.json()["detail"]

def test_demo_login_by_role(client: TestClient):
    for role in ("STOREKEEPER", "PROCUREMENT_OFFICER", "MANAGER"):
        resp = client.post("/api/v1/auth/demo-login", json={"role": role})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["role"] == role

def test_get_me_with_bearer_token(client: TestClient):
    # 1. Login to get token
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "sara.mansour@example.com",
        "password": "stocksense123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # 2. Call /api/v1/auth/me with Bearer token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "sara.mansour@example.com"
    assert me_data["role"] == "PROCUREMENT_OFFICER"

def test_get_me_without_token_rejected(client: TestClient):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401

def test_create_user_and_authenticate(client: TestClient):
    # Create new manager user
    email = "new.supervisor@stocksense.oilfield"
    create_resp = client.post("/api/v1/users", json={
        "full_name": "Tarek Field Supervisor",
        "email": email,
        "role": "MANAGER",
        "password": "RigPass2026!Secured"
    })
    assert create_resp.status_code == 201

    # Login with custom password
    login_resp = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "RigPass2026!Secured"
    })
    assert login_resp.status_code == 200
    assert login_resp.json()["user"]["email"] == email
