from datetime import datetime, timezone
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.alerts import Alert

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
    db = SessionLocal()
    test_alert = Alert(
        alert_type="LOW_STOCK",
        severity="WARNING",
        message="Test alert for unit testing acknowledge and resolve lifecycle",
        status="OPEN",
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(test_alert)
    db.commit()
    target_id = test_alert.id
    db.close()

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
