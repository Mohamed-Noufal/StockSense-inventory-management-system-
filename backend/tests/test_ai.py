import pytest
from backend.ai import (
    classify_demand,
    forecast_demand,
    croston_forecast,
    sba_forecast,
    calculate_inventory_policy,
    ReplenishmentAgent,
    evaluate_forecast,
)

def test_demand_classification():
    # Sparse intermittent series
    intermittent = [0, 0, 5, 0, 0, 0, 8, 0, 0, 4]
    pattern, adi, cv2 = classify_demand(intermittent)
    assert pattern in ["intermittent", "lumpy"]
    assert adi > 1.0

def test_sba_forecast():
    series = [0, 2, 0, 0, 5, 0, 3, 0]
    res = forecast_demand(series, method="sba", horizon=3)
    assert res["method"] == "sba"
    assert len(res["mean_values"]) == 3
    assert res["mean_values"][0] >= 0

def test_inventory_policy():
    policy = calculate_inventory_policy(
        mean_weekly_demand=4.0,
        lead_time_days=14,  # 2 weeks
        service_level=0.95,
        moq=5,
    )
    assert policy["lead_time_demand"] == 8.0
    assert policy["safety_stock"] > 0
    assert policy["reorder_point"] > policy["lead_time_demand"]
    assert policy["order_up_to"] > policy["reorder_point"]

def test_replenishment_agent_proposal():
    policy = {
        "safety_stock": 5,
        "reorder_point": 13,
        "order_up_to": 20,
        "lead_time_days": 14,
        "service_level": 0.95,
    }
    
    # Below ROP: should generate recommendation
    rec = ReplenishmentAgent.evaluate_item(
        item_id=1,
        item_sku="TEST-01",
        item_name="Hydraulic Valve",
        supplier_id=2,
        destination_location_id=1,
        on_hand=4,
        on_order=0,
        policy=policy,
        moq=10,
    )
    assert rec is not None
    assert rec["urgency"] == "HIGH"
    assert rec["suggested_qty"] >= 10
    assert "explanation" in rec
    assert "formula" in rec["explanation"]

def test_evaluate_forecast():
    actuals = [10.0, 5.0, 8.0]
    preds = [9.0, 5.0, 9.0]
    metrics = evaluate_forecast(actuals, preds)
    assert "mae" in metrics
    assert "rmse" in metrics
    assert "bias" in metrics

def test_ai_run_and_recommendations_endpoint(client):
    # Trigger an AI run
    res = client.post("/api/v1/ai/runs", json={
        "data_cutoff": "2026-10-12",
        "random_seed": 42,
        "service_level": 0.95,
        "default_method": "sba"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCEEDED"
    assert data["model_version"] == "0.1.0"
    
    # Check recommendations query
    rec_res = client.get("/api/v1/ai/recommendations")
    assert rec_res.status_code == 200
    assert isinstance(rec_res.json(), list)

def test_ai_model_report_endpoint(client):
    res = client.get("/api/v1/ai/model-report")
    assert res.status_code == 200
    data = res.json()
    assert "ai_run_status" in data
    assert "forecast_evaluation" in data
    assert "policy_comparison" in data
    assert "synthetic_dataset_profile" in data

    fe = data["forecast_evaluation"]
    assert "overall_rmsse" in fe
    assert "overall_mase" in fe
    assert "forecast_bias" in fe
    assert len(fe["by_pattern"]) > 0

    pc = data["policy_comparison"]
    assert "baseline_min_max" in pc
    assert "stocksense_policy" in pc
    assert pc["baseline_min_max"]["fill_rate_pct"] >= 0.0
    assert pc["stocksense_policy"]["fill_rate_pct"] >= 0.0

    sd = data["synthetic_dataset_profile"]
    assert "zero_demand_weeks_pct" in sd
    assert "disclaimer" in sd


