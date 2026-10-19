from fastapi.testclient import TestClient

def test_list_users(client: TestClient):
    resp = client.get("/api/v1/users")
    assert resp.status_code == 200
    users = resp.json()
    assert isinstance(users, list)
    assert len(users) >= 1
    assert any(u["role"] == "STOREKEEPER" for u in users)

def test_get_current_user_me(client: TestClient):
    # Unauthenticated request must be rejected with 401
    unauth_resp = client.get("/api/v1/users/me")
    assert unauth_resp.status_code == 401

    # Authenticated request returns user profile
    login_resp = client.post("/api/v1/auth/demo-login", json={"role": "STOREKEEPER"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    user = resp.json()
    assert "email" in user
    assert "full_name" in user
    assert "role" in user

def test_create_user(client: TestClient):
    payload = {
        "full_name": "Test Officer",
        "email": "test.officer@example.com",
        "role": "PROCUREMENT_OFFICER"
    }
    resp = client.post("/api/v1/users", json=payload)
    if resp.status_code == 400:
        assert "already exists" in resp.json()["detail"]
    else:
        assert resp.status_code == 201
        assert resp.json()["full_name"] == "Test Officer"

def test_unauthorized_admin_creation_rejected(client: TestClient):
    # Anonymous caller trying to create an ADMIN account must receive 403 Forbidden
    payload = {
        "full_name": "Rogue Admin",
        "email": "rogue.admin@example.com",
        "role": "ADMIN"
    }
    resp = client.post("/api/v1/users", json=payload)
    assert resp.status_code == 403
    assert "requires active administrator authentication" in resp.json()["detail"]
