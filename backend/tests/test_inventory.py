import uuid
import pytest
from backend.app.core.database import SessionLocal
from backend.app.models.categories import Category
from backend.app.models.items import Item
from backend.app.models.locations import Location
from backend.app.models.stock_balances import StockBalance
from backend.app.models.stock_movements import StockMovement

@pytest.fixture(scope="module")
def seeded_fixtures():
    db = SessionLocal()
    # Create test category
    cat = db.query(Category).filter_by(name="Test Category").first()
    if not cat:
        cat = Category(name="Test Category", description="Category for integration tests")
        db.add(cat)
        db.commit()
        db.refresh(cat)

    # Create test locations
    loc1 = db.query(Location).filter_by(code="LOC_TEST_1").first()
    if not loc1:
        loc1 = Location(code="LOC_TEST_1", name="Test Warehouse", location_type="WAREHOUSE")
        db.add(loc1)
    loc2 = db.query(Location).filter_by(code="LOC_TEST_2").first()
    if not loc2:
        loc2 = Location(code="LOC_TEST_2", name="Test Rig", location_type="RIG_SITE")
        db.add(loc2)
    db.commit()
    db.refresh(loc1)
    db.refresh(loc2)

    # Create test item
    sku = f"SKU_TEST_{uuid.uuid4().hex[:6].upper()}"
    item = Item(sku=sku, name="Test Mud Valve", category_id=cat.id, uom="pcs", criticality="CRITICAL")
    db.add(item)
    db.commit()
    db.refresh(item)
    
    item_id = int(item.id)
    loc1_id = int(loc1.id)
    loc2_id = int(loc2.id)
    db.close()
    return {"item_id": item_id, "loc1_id": loc1_id, "loc2_id": loc2_id}

def test_post_receipt_movement(client, seeded_fixtures):
    payload = {
        "item_id": seeded_fixtures["item_id"],
        "location_id": seeded_fixtures["loc1_id"],
        "movement_type": "RECEIPT",
        "quantity": 50,
        "reason": "Initial test receipt"
    }
    resp = client.post("/api/v1/inventory/movements", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["quantity"] == 50
    assert data["movement_type"] == "RECEIPT"

    # Verify balance
    bal_resp = client.get(f"/api/v1/inventory/balances?item_id={seeded_fixtures['item_id']}&location_id={seeded_fixtures['loc1_id']}")
    assert bal_resp.status_code == 200
    balances = bal_resp.json()
    assert len(balances) == 1
    assert balances[0]["quantity_on_hand"] >= 50

def test_post_issue_movement(client, seeded_fixtures):
    payload = {
        "item_id": seeded_fixtures["item_id"],
        "location_id": seeded_fixtures["loc1_id"],
        "movement_type": "ISSUE",
        "quantity": 10,
        "reason": "Test issue to field"
    }
    resp = client.post("/api/v1/inventory/movements", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["quantity"] == -10
    assert data["movement_type"] == "ISSUE"

def test_over_issue_rejection(client, seeded_fixtures):
    payload = {
        "item_id": seeded_fixtures["item_id"],
        "location_id": seeded_fixtures["loc1_id"],
        "movement_type": "ISSUE",
        "quantity": 99999,
        "reason": "Attempting to issue excessive stock"
    }
    resp = client.post("/api/v1/inventory/movements", json=payload)
    assert resp.status_code == 400
    assert "Insufficient stock" in resp.json()["detail"]

def test_inter_location_transfer(client, seeded_fixtures):
    transfer_payload = {
        "item_id": seeded_fixtures["item_id"],
        "from_location_id": seeded_fixtures["loc1_id"],
        "to_location_id": seeded_fixtures["loc2_id"],
        "quantity": 15,
        "reason": "Transfer to rig"
    }
    resp = client.post("/api/v1/inventory/transfer", json=transfer_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert "transfer_group_id" in data
    assert data["quantity"] == 15

    # Check recipient location balance
    bal2_resp = client.get(f"/api/v1/inventory/balances?item_id={seeded_fixtures['item_id']}&location_id={seeded_fixtures['loc2_id']}")
    assert bal2_resp.status_code == 200
    assert bal2_resp.json()[0]["quantity_on_hand"] == 15

def test_integrity_check(client):
    resp = client.get("/api/v1/inventory/integrity-check")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "HEALTHY"
    assert data["mismatches_count"] == 0

def test_post_adjustment_movement(client, seeded_fixtures):
    # Surplus adjustment (+)
    surplus_payload = {
        "item_id": seeded_fixtures["item_id"],
        "location_id": seeded_fixtures["loc1_id"],
        "movement_type": "ADJUSTMENT",
        "quantity": 5,
        "adjustment_direction": "SURPLUS",
        "reason": "CT-9001 - Cycle count surplus"
    }
    resp1 = client.post("/api/v1/inventory/movements", json=surplus_payload)
    assert resp1.status_code == 201
    assert resp1.json()["quantity"] == 5
    assert resp1.json()["reference_display"] == "CT-9001"

    # Shrinkage adjustment (-)
    shrink_payload = {
        "item_id": seeded_fixtures["item_id"],
        "location_id": seeded_fixtures["loc1_id"],
        "movement_type": "ADJUSTMENT",
        "quantity": 2,
        "adjustment_direction": "SHRINKAGE",
        "reason": "CT-9002 - Count discrepancy shrinkage"
    }
    resp2 = client.post("/api/v1/inventory/movements", json=shrink_payload)
    assert resp2.status_code == 201
    assert resp2.json()["quantity"] == -2

def test_operations_stats(client):
    resp = client.get("/api/v1/inventory/operations/stats?days=7")
    assert resp.status_code == 200
    data = resp.json()
    assert data["timeframe_days"] == 7
    assert data["issues_count"] >= 42
    assert data["transfers_count"] >= 18
    assert data["receipts_count"] >= 27
    assert data["adjustments_count"] >= 3
    assert "issues_trend_pct" in data

def test_ledger_enriched_fields(client, seeded_fixtures):
    resp = client.get(f"/api/v1/inventory/ledger?item_id={seeded_fixtures['item_id']}&limit=10")
    assert resp.status_code == 200
    movements = resp.json()
    assert len(movements) > 0
    top = movements[0]
    assert "route_display" in top
    assert "reference_display" in top
    assert "item_name" in top
    assert top["status"] == "Completed"

def test_create_item_and_alias_resolution(client, seeded_fixtures):
    unique_id = uuid.uuid4().hex[:6].upper()
    test_sku = f"CHOKE-VLV-{unique_id}"
    test_sup_sku = f"VND-{test_sku}"

    # Get active category and supplier
    cat_resp = client.get("/api/v1/inventory/categories")
    cat_id = cat_resp.json()[0]["id"] if cat_resp.status_code == 200 and cat_resp.json() else 1

    sup_resp = client.get("/api/v1/suppliers")
    sup_id = sup_resp.json()[0]["id"] if sup_resp.status_code == 200 and sup_resp.json() else None

    payload = {
        "sku": test_sku,
        "name": "High-Pressure Choke Valve Assembly 2-1/16in",
        "description": "Adjustable choke valve 10000psi API-6A",
        "category_id": cat_id,
        "uom": "EA",
        "unit_cost_minor": 145000,
        "criticality": "CRITICAL",
        "initial_location_id": seeded_fixtures["loc1_id"],
        "initial_stock": 3,
        "supplier_id": sup_id,
        "supplier_sku": test_sup_sku
    }
    resp = client.post("/api/v1/inventory/items", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["sku"] == test_sku
    assert data["total_on_hand"] == 3
    assert data["criticality"] == "CRITICAL"
    if sup_id:
        assert test_sup_sku in data["supplier_skus"]

    # Verify duplicate SKU rejection
    dup_resp = client.post("/api/v1/inventory/items", json=payload)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]

    # Verify item is in list_items with supplier_skus
    list_resp = client.get("/api/v1/inventory/items")
    assert list_resp.status_code == 200
    found = next((i for i in list_resp.json() if i["sku"] == test_sku), None)
    assert found is not None
    if sup_id:
        assert test_sup_sku in found["supplier_skus"]
