import uuid
from fastapi.testclient import TestClient

def test_complete_golden_workflow(client: TestClient):
    """
    Validates the end-to-end Golden Demo workflow:
    1. Integrity check initial state (0 mismatches).
    2. Over-issue rejection (HTTP 400).
    3. Valid receipt & issue lifecycle.
    4. AI replenishment analysis run & explainability check.
    5. One-click conversion from AI recommendation to Draft PO.
    6. PO approval & atomic receipt posting linked to ledger.
    7. Final zero-mismatch ledger audit reconciliation.
    """
    # 1. Initial integrity verification
    resp = client.get("/api/v1/inventory/integrity-check")
    assert resp.status_code == 200
    assert resp.json()["status"] == "HEALTHY"
    assert resp.json()["mismatches_count"] == 0

    # 2. Over-issue rejection (no stock or excessive quantity)
    over_issue = client.post("/api/v1/inventory/movements", json={
        "movement_type": "ISSUE",
        "item_id": 1,
        "location_id": 1,
        "quantity": 999999,
        "idempotency_key": str(uuid.uuid4()),
        "reason": "Stress test over-issue rejection"
    })
    assert over_issue.status_code == 400
    assert "insufficient" in over_issue.json()["detail"].lower()

    # 3. Post a valid receipt then valid issue
    receipt_key = str(uuid.uuid4())
    rec_resp = client.post("/api/v1/inventory/movements", json={
        "movement_type": "RECEIPT",
        "item_id": 1,
        "location_id": 1,
        "quantity": 25,
        "idempotency_key": receipt_key,
        "reason": "Initial yard stocking"
    })
    assert rec_resp.status_code == 201

    issue_resp = client.post("/api/v1/inventory/movements", json={
        "movement_type": "ISSUE",
        "item_id": 1,
        "location_id": 1,
        "quantity": 5,
        "idempotency_key": str(uuid.uuid4()),
        "reason": "Maintenance issue to rig"
    })
    assert issue_resp.status_code == 201

    # Ensure item 6 total on hand drops below reorder point (ROP ~ 5)
    for b in client.get("/api/v1/inventory/balances?item_id=6").json():
        qty_to_issue = b["quantity_on_hand"] if b["location_id"] != 1 else max(0, b["quantity_on_hand"] - 1)
        if qty_to_issue > 0:
            client.post("/api/v1/inventory/movements", json={
                "movement_type": "ISSUE",
                "item_id": 6,
                "location_id": b["location_id"],
                "quantity": qty_to_issue,
                "idempotency_key": str(uuid.uuid4()),
                "reason": "Expedite drill overhaul consumption triggering ROP"
            })

    # 4. Trigger AI replenishment run
    run_resp = client.post("/api/v1/ai/runs", json={
        "service_level": 0.95,
        "default_method": "SBA"
    })
    assert run_resp.status_code == 200
    assert run_resp.json()["status"] == "SUCCEEDED"

    # 5. Fetch recommendations
    recs_resp = client.get("/api/v1/ai/recommendations?status=OPEN")
    assert recs_resp.status_code == 200
    recs = recs_resp.json()
    assert len(recs) > 0

    target_rec = recs[0]
    rec_id = target_rec["id"]
    assert target_rec["status"] == "OPEN"
    assert target_rec["suggested_qty"] > 0
    assert target_rec["explanation_json"] is not None

    # 6. Approve recommendation -> converts directly to draft PO
    approve_resp = client.post(f"/api/v1/ai/recommendations/{rec_id}/approve")
    assert approve_resp.status_code == 200
    po_data = approve_resp.json()
    assert po_data["status"] == "DRAFT"
    po_id = po_data["id"]

    # Verify recommendation marked APPROVED
    updated_recs = client.get("/api/v1/ai/recommendations").json()
    matched = [r for r in updated_recs if r["id"] == rec_id][0]
    assert matched["status"] == "APPROVED"
    assert matched["created_po_id"] == po_id

    # 7. Procurement officer approves the PO
    po_approve = client.post(f"/api/v1/po/{po_id}/approve")
    assert po_approve.status_code == 200
    assert po_approve.json()["status"] == "APPROVED"

    # 8. Warehouse receives the goods
    line = po_approve.json()["lines"][0]
    po_receive = client.post(f"/api/v1/po/{po_id}/receive", json={
        "po_line_id": line["id"],
        "quantity_received": line["qty_ordered"],
        "idempotency_key": str(uuid.uuid4()),
        "actor_label": "Warehouse Supervisor"
    })
    assert po_receive.status_code == 200
    assert po_receive.json()["status"] == "RECEIVED"

    # 9. Final ledger audit reconciliation
    final_audit = client.get("/api/v1/inventory/integrity-check")
    assert final_audit.status_code == 200
    assert final_audit.json()["status"] == "HEALTHY"
    assert final_audit.json()["mismatches_count"] == 0
