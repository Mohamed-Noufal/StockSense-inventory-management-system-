from fastapi.testclient import TestClient

def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "StockSense" in data["project"]

def test_health_endpoint(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"]["status"] == "connected"
    assert data["database"]["engine"] == "SQLite"
    assert data["database"]["foreign_keys"] is True
    assert data["database"]["journal_mode"] == "wal"

def test_ready_endpoint(client: TestClient):
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["tables_initialized"] is True
    assert "stock_movements" in data["table_counts"]
    assert "stock_balances" in data["table_counts"]
    assert "items" in data["table_counts"]
