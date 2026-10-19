from fastapi.testclient import TestClient

def test_get_workspace_info(client: TestClient):
    resp = client.get("/api/v1/workspace/info")
    assert resp.status_code == 200
    data = resp.json()
    assert "company_name" in data
    assert "facility_name" in data
    assert "total_items" in data
    assert "total_locations" in data

def test_create_location(client: TestClient):
    payload = {
        "code": "TEST-LOC-01",
        "name": "Test Yard Location",
        "location_type": "YARD",
        "is_default_replenishment": 0,
    }
    resp = client.post("/api/v1/inventory/locations", json=payload)
    if resp.status_code == 400:
        assert "already exists" in resp.json()["detail"]
    else:
        assert resp.status_code == 201
        assert resp.json()["code"] == "TEST-LOC-01"

def test_clean_workspace_and_restore_demo(client: TestClient):
    clean_payload = {
        "company_name": "Al-Maha Energy Supplies",
        "warehouse_name": "Dammam Central Depot",
        "warehouse_code": "DAM-01",
    }

    # 1. Unauthenticated calls must be rejected with 401
    unauth_clean = client.post("/api/v1/workspace/init-clean", json=clean_payload)
    assert unauth_clean.status_code == 401

    unauth_restore = client.post("/api/v1/workspace/restore-demo")
    assert unauth_restore.status_code == 401

    # 2. Non-manager role (STOREKEEPER) must be rejected with 403 Forbidden
    login_sk = client.post("/api/v1/auth/demo-login", json={"role": "STOREKEEPER"})
    assert login_sk.status_code == 200
    sk_headers = {"Authorization": f"Bearer {login_sk.json()['access_token']}"}

    forbidden_clean = client.post("/api/v1/workspace/init-clean", json=clean_payload, headers=sk_headers)
    assert forbidden_clean.status_code == 403

    # 3. Authenticate as MANAGER (authorized role)
    login_mgr = client.post("/api/v1/auth/demo-login", json={"role": "MANAGER"})
    assert login_mgr.status_code == 200
    mgr_headers = {"Authorization": f"Bearer {login_mgr.json()['access_token']}"}

    # 4. Initialize clean company workspace
    clean_resp = client.post("/api/v1/workspace/init-clean", json=clean_payload, headers=mgr_headers)
    assert clean_resp.status_code == 200
    clean_data = clean_resp.json()
    assert clean_data["company_name"] == "Al-Maha Energy Supplies"
    assert clean_data["total_items"] == 0
    assert clean_data["total_locations"] == 1
    assert clean_data["is_demo_dataset"] is False

    # Verify inventory is indeed empty
    items_resp = client.get("/api/v1/inventory/items")
    assert items_resp.status_code == 200
    assert len(items_resp.json()) == 0

    # 5. Restore oilfield demo dataset with authorized manager credentials
    restore_resp = client.post("/api/v1/workspace/restore-demo", headers=mgr_headers)
    assert restore_resp.status_code == 200
    restore_data = restore_resp.json()
    assert restore_data["is_demo_dataset"] is True
    assert restore_data["total_items"] >= 15

    # Verify demo items restored
    items_restored = client.get("/api/v1/inventory/items")
    assert items_restored.status_code == 200
    assert len(items_restored.json()) >= 15

def test_update_workspace_profile(client: TestClient):
    resp = client.put("/api/v1/workspace/profile", json={
        "company_name": "Zara Apparel Logistics",
        "industry": "APPAREL"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["company_name"] == "Zara Apparel Logistics"
    assert data["industry"] == "APPAREL"

def test_delete_location(client: TestClient):
    # Create extra location
    create_resp = client.post("/api/v1/inventory/locations", json={
        "code": "YARD-TEMP-99",
        "name": "Temporary Staging Yard",
        "location_type": "YARD",
        "is_default_replenishment": 0,
    })
    assert create_resp.status_code == 201
    loc_id = create_resp.json()["id"]

    # Delete extra location
    del_resp = client.delete(f"/api/v1/inventory/locations/{loc_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

def test_purge_user_data_preserves_test_catalog(client: TestClient):
    # 1. Login as storekeeper
    login_resp = client.post("/api/v1/auth/demo-login", json={"role": "STOREKEEPER"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    user = login_resp.json()["user"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check items count before purge
    items_before = client.get("/api/v1/inventory/items").json()
    assert len(items_before) >= 15

    # 3. Call purge user data
    purge_resp = client.post("/api/v1/workspace/purge-user-data", json={"user_id": user["id"]}, headers=headers)
    assert purge_resp.status_code == 200
    purge_data = purge_resp.json()
    assert purge_data["success"] is True
    assert purge_data["user_id"] == user["id"]

    # 4. Crucial: verify that the 15 baseline test items remain completely intact!
    items_after = client.get("/api/v1/inventory/items").json()
    assert len(items_after) == len(items_before)

