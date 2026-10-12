from fastapi.testclient import TestClient

def test_list_users(client: TestClient):
    resp = client.get("/api/v1/users")
    assert resp.status_code == 200
    users = resp.json()
    assert isinstance(users, list)
    assert len(users) >= 1
    assert any(u["role"] == "STOREKEEPER" for u in users)

def test_get_current_user_me(client: TestClient):
    resp = client.get("/api/v1/users/me")
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
    # Clean up if exists
    resp = client.post("/api/v1/users", json=payload)
    if resp.status_code == 400:
        assert "already exists" in resp.json()["detail"]
    else:
        assert resp.status_code == 201
        assert resp.json()["full_name"] == "Test Officer"
