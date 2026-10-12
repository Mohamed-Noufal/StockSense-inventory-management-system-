import uuid
import pytest
from backend.app.core.database import SessionLocal
from backend.app.models.categories import Category
from backend.app.models.items import Item
from backend.app.models.locations import Location
from backend.app.models.suppliers import Supplier

@pytest.fixture(scope="module")
def po_fixtures():
    db = SessionLocal()
    # Supplier
    sup = db.query(Supplier).filter_by(name="Test Petro Supplies").first()
    if not sup:
        sup = Supplier(name="Test Petro Supplies", country="UAE", is_active=1)
        db.add(sup)
        db.commit()
        db.refresh(sup)

    # Category & Item
    cat = db.query(Category).first()
    sku = f"PO_SKU_{uuid.uuid4().hex[:6].upper()}"
    item = Item(sku=sku, name="Test Drill Pipe", category_id=cat.id if cat else 1, uom="pcs", criticality="CRITICAL")
    db.add(item)
    db.commit()
    db.refresh(item)

    # Location
    loc = db.query(Location).filter_by(code="LOC_TEST_1").first()
    if not loc:
        loc = db.query(Location).first()

    data = {"supplier_id": sup.id, "item_id": item.id, "location_id": loc.id}
    db.close()
    return data

def test_create_draft_po(client, po_fixtures):
    payload = {
        "supplier_id": po_fixtures["supplier_id"],
        "lines": [
            {
                "item_id": po_fixtures["item_id"],
                "destination_location_id": po_fixtures["location_id"],
                "qty_ordered": 20,
                "unit_price_minor": 15000,
            }
        ],
        "notes": "Urgent drilling replenishment"
    }
    resp = client.post("/api/v1/po", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "DRAFT"
    assert data["po_number"].startswith("PO-")
    assert len(data["lines"]) == 1
    assert data["lines"][0]["qty_ordered"] == 20
    assert data["lines"][0]["qty_received"] == 0
    assert data["lines"][0]["remaining_quantity"] == 20

def test_cannot_receive_on_draft(client, po_fixtures):
    # Create draft PO
    payload = {
        "supplier_id": po_fixtures["supplier_id"],
        "lines": [{"item_id": po_fixtures["item_id"], "destination_location_id": po_fixtures["location_id"], "qty_ordered": 10, "unit_price_minor": 5000}]
    }
    po = client.post("/api/v1/po", json=payload).json()
    line_id = po["lines"][0]["id"]

    # Attempt receipt on draft PO
    rcv_resp = client.post(f"/api/v1/po/{po['id']}/receive", json={"po_line_id": line_id, "quantity_received": 5})
    assert rcv_resp.status_code == 400
    assert "DRAFT" in rcv_resp.json()["detail"]

def test_approve_po(client, po_fixtures):
    payload = {
        "supplier_id": po_fixtures["supplier_id"],
        "lines": [{"item_id": po_fixtures["item_id"], "destination_location_id": po_fixtures["location_id"], "qty_ordered": 15, "unit_price_minor": 8000}]
    }
    po = client.post("/api/v1/po", json=payload).json()
    resp = client.post(f"/api/v1/po/{po['id']}/approve")
    assert resp.status_code == 200
    approved = resp.json()
    assert approved["status"] == "APPROVED"
    assert approved["order_date"] is not None

def test_partial_receipt_and_stock_increment(client, po_fixtures):
    payload = {
        "supplier_id": po_fixtures["supplier_id"],
        "lines": [{"item_id": po_fixtures["item_id"], "destination_location_id": po_fixtures["location_id"], "qty_ordered": 12, "unit_price_minor": 6000}]
    }
    po = client.post("/api/v1/po", json=payload).json()
    client.post(f"/api/v1/po/{po['id']}/approve")
    line_id = po["lines"][0]["id"]

    # Initial balance
    bal_before = client.get(f"/api/v1/inventory/balances?item_id={po_fixtures['item_id']}&location_id={po_fixtures['location_id']}").json()
    initial_qty = bal_before[0]["quantity_on_hand"] if bal_before else 0

    # Receive partial (5 out of 12)
    rcv_resp = client.post(f"/api/v1/po/{po['id']}/receive", json={"po_line_id": line_id, "quantity_received": 5})
    assert rcv_resp.status_code == 200
    updated_po = rcv_resp.json()
    assert updated_po["status"] == "PARTIALLY_RECEIVED"
    assert updated_po["lines"][0]["qty_received"] == 5
    assert updated_po["lines"][0]["remaining_quantity"] == 7

    # Check inventory balance updated atomically
    bal_after = client.get(f"/api/v1/inventory/balances?item_id={po_fixtures['item_id']}&location_id={po_fixtures['location_id']}").json()
    assert bal_after[0]["quantity_on_hand"] == initial_qty + 5

def test_over_receipt_rejection(client, po_fixtures):
    payload = {
        "supplier_id": po_fixtures["supplier_id"],
        "lines": [{"item_id": po_fixtures["item_id"], "destination_location_id": po_fixtures["location_id"], "qty_ordered": 10, "unit_price_minor": 2000}]
    }
    po = client.post("/api/v1/po", json=payload).json()
    client.post(f"/api/v1/po/{po['id']}/approve")
    line_id = po["lines"][0]["id"]

    # Attempt to receive 15 when only 10 were ordered
    over_resp = client.post(f"/api/v1/po/{po['id']}/receive", json={"po_line_id": line_id, "quantity_received": 15})
    assert over_resp.status_code == 400
    assert "Over-receipt rejected" in over_resp.json()["detail"]

def test_full_receipt_and_integrity_check(client, po_fixtures):
    payload = {
        "supplier_id": po_fixtures["supplier_id"],
        "lines": [{"item_id": po_fixtures["item_id"], "destination_location_id": po_fixtures["location_id"], "qty_ordered": 8, "unit_price_minor": 4500}]
    }
    po = client.post("/api/v1/po", json=payload).json()
    client.post(f"/api/v1/po/{po['id']}/approve")
    line_id = po["lines"][0]["id"]

    # Receive full quantity in one go
    rcv_resp = client.post(f"/api/v1/po/{po['id']}/receive", json={"po_line_id": line_id, "quantity_received": 8})
    assert rcv_resp.status_code == 200
    assert rcv_resp.json()["status"] == "RECEIVED"
    assert rcv_resp.json()["lines"][0]["remaining_quantity"] == 0

    # Verify inventory integrity reports 0 mismatches
    check_resp = client.get("/api/v1/inventory/integrity-check")
    assert check_resp.status_code == 200
    assert check_resp.json()["mismatches_count"] == 0

def test_cancel_po_restrictions(client, po_fixtures):
    # Fresh PO can be cancelled
    payload = {
        "supplier_id": po_fixtures["supplier_id"],
        "lines": [{"item_id": po_fixtures["item_id"], "destination_location_id": po_fixtures["location_id"], "qty_ordered": 5, "unit_price_minor": 1000}]
    }
    po = client.post("/api/v1/po", json=payload).json()
    cancel_resp = client.post(f"/api/v1/po/{po['id']}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    # PO with received goods cannot be cancelled
    po2 = client.post("/api/v1/po", json=payload).json()
    client.post(f"/api/v1/po/{po2['id']}/approve")
    line_id = po2["lines"][0]["id"]
    client.post(f"/api/v1/po/{po2['id']}/receive", json={"po_line_id": line_id, "quantity_received": 2})

    blocked_cancel = client.post(f"/api/v1/po/{po2['id']}/cancel")
    assert blocked_cancel.status_code == 400
    assert "Cannot cancel PO with received goods" in blocked_cancel.json()["detail"]
