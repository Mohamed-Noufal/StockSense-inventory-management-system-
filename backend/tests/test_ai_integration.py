import json
from datetime import datetime, timezone, timedelta
import pytest
from backend.app.core.database import SessionLocal
from backend.app.models.items import Item
from backend.app.models.locations import Location
from backend.app.models.stock_movements import StockMovement
from backend.app.models.purchase_orders import PurchaseOrder
from backend.ai.models import AIRun, ItemPolicy, Recommendation
from backend.ai.demand_extractor import extract_weekly_demand

def test_demand_extractor_zero_leakage():
    db = SessionLocal()
    item = db.query(Item).first()
    loc = db.query(Location).first()
    assert item is not None and loc is not None

    now = datetime.now(timezone.utc)
    cutoff_dt = now - timedelta(days=14)
    cutoff_iso = cutoff_dt.isoformat()

    # Extract baseline
    series_before = extract_weekly_demand(db, cutoff_iso=cutoff_iso, history_weeks=52, item_id=item.id)
    total_before = sum(series_before[item.id])

    # Insert a future issue movement AFTER the cutoff date
    future_mov = StockMovement(
        item_id=item.id,
        location_id=loc.id,
        movement_type="ISSUE",
        quantity=-20,
        occurred_at=(now - timedelta(days=2)).isoformat(),
        created_at=(now - timedelta(days=2)).isoformat(),
        actor_label="leakage-test",
    )
    db.add(future_mov)
    db.commit()

    try:
        # Re-extract with the earlier cutoff
        series_after = extract_weekly_demand(db, cutoff_iso=cutoff_iso, history_weeks=52, item_id=item.id)
        total_after = sum(series_after[item.id])

        # Assert zero leakage: future movement was strictly excluded!
        assert total_before == total_after, "Future movement leaked into historical demand!"
    finally:
        db.delete(future_mov)
        db.commit()
        db.close()

def test_execute_ai_run_and_policies(client):
    resp = client.post("/api/v1/ai/runs", json={
        "random_seed": 42,
        "service_level": 0.95,
        "default_method": "sba"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCEEDED"
    assert data["run_type"] == "FORECAST_AND_POLICY"
    run_id = data["id"]

    # Verify item policies exist in database for this run
    db = SessionLocal()
    policies = db.query(ItemPolicy).filter_by(run_id=run_id).all()
    assert len(policies) > 0
    first_pol = policies[0]
    assert first_pol.demand_pattern in ('smooth', 'erratic', 'intermittent', 'lumpy', 'insufficient_history')
    assert first_pol.reorder_point >= 0
    assert first_pol.order_up_to >= first_pol.reorder_point
    db.close()

def test_recommendation_listing_and_explainability(client):
    # Ensure at least one run was triggered
    client.post("/api/v1/ai/runs", json={"random_seed": 42, "service_level": 0.95})

    resp = client.get("/api/v1/ai/recommendations")
    assert resp.status_code == 200
    recs = resp.json()
    assert isinstance(recs, list)

    if len(recs) > 0:
        first = recs[0]
        assert "explanation_json" in first
        assert "summary_text" in first
        assert first["status"] in ("OPEN", "APPROVED", "DISMISSED")
        assert first["suggested_qty"] > 0

        # Verify parsed explanation formula
        explanation = json.loads(first["explanation_json"])
        assert "inventory_position" in explanation
        assert "reorder_point" in explanation

def test_approve_recommendation_creates_draft_po(client):
    # Trigger AI replenishment run
    run_resp = client.post("/api/v1/ai/runs", json={"random_seed": 42, "service_level": 0.95})
    assert run_resp.status_code == 200

    open_recs = client.get("/api/v1/ai/recommendations?status=OPEN").json()
    assert len(open_recs) > 0, "Expected at least one open recommendation"

    rec = open_recs[0]
    rec_id = rec["id"]

    # Approve recommendation
    appr_resp = client.post(f"/api/v1/ai/recommendations/{rec_id}/approve")
    assert appr_resp.status_code == 200
    po_data = appr_resp.json()
    assert po_data["status"] == "DRAFT"
    assert po_data["source_recommendation_id"] == rec_id
    assert len(po_data["lines"]) == 1
    assert po_data["lines"][0]["item_id"] == rec["item_id"]
    assert po_data["lines"][0]["qty_ordered"] == rec["suggested_qty"]

    # Attempting to approve again must be rejected (400)
    retry_resp = client.post(f"/api/v1/ai/recommendations/{rec_id}/approve")
    assert retry_resp.status_code == 400
    assert "already" in retry_resp.json()["detail"].lower()

def test_dismiss_recommendation(client):
    run_resp = client.post("/api/v1/ai/runs", json={"random_seed": 42, "service_level": 0.95})
    assert run_resp.status_code == 200

    open_recs = client.get("/api/v1/ai/recommendations?status=OPEN").json()
    assert len(open_recs) > 0, "Expected at least one open recommendation to dismiss"

    rec = open_recs[0]
    rec_id = rec["id"]

    dism_resp = client.post(
        f"/api/v1/ai/recommendations/{rec_id}/dismiss",
        json={"action": "DISMISS", "decision_note": "Postponed due to project rescheduling"}
    )
    assert dism_resp.status_code == 200
    updated = dism_resp.json()
    assert updated["status"] == "DISMISSED"

