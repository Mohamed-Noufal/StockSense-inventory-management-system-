from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_list_alerts_and_seed():
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first_alert = data[0]
    assert "severity" in first_alert
    assert "status" in first_alert
    assert "alert_type" in first_alert
    assert "message" in first_alert

def test_acknowledge_and_resolve_alert():
    # List alerts
    list_res = client.get("/api/v1/alerts?status=OPEN")
    assert list_res.status_code == 200
    data = list_res.json()
    assert len(data) > 0
    target_id = data[0]["id"]

    # Acknowledge
    ack_res = client.post(f"/api/v1/alerts/{target_id}/acknowledge", json={"user_id": 1, "notes": "Investigating with rig crew"})
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["status"] == "ACKNOWLEDGED"
    assert ack_data["acknowledged_at"] is not None

    # Resolve
    res_res = client.post(f"/api/v1/alerts/{target_id}/resolve", json={"user_id": 1, "resolution_notes": "Emergency PO dispatched"})
    assert res_res.status_code == 200
    res_data = res_res.json()
    assert res_data["status"] == "RESOLVED"
    assert res_data["resolved_at"] is not None
