from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict

class AIRunTriggerRequest(BaseModel):
    data_cutoff: Optional[str] = Field(None, description="ISO-8601 data cutoff date YYYY-MM-DD")
    random_seed: int = Field(42, description="Seed for deterministic generation and policy simulation")
    service_level: float = Field(0.95, ge=0.50, le=0.999, description="Target cycle service level")
    default_method: str = Field("sba", description="Default intermittent forecasting algorithm (sba, croston, ma8)")

class ForecastItemResponse(BaseModel):
    item_id: int
    period_start: str
    horizon_step: int
    mean: float
    method: str

class RecommendationResponse(BaseModel):
    id: int
    run_id: int
    item_id: int
    supplier_id: int
    destination_location_id: int
    status: str
    urgency: str
    on_hand: int
    on_order: int
    inventory_position: int
    reorder_point: int
    suggested_qty: int
    explanation_json: str
    summary_text: str
    created_at: str
    item_sku: Optional[str] = None
    item_name: Optional[str] = None
    supplier_name: Optional[str] = None
    location_code: Optional[str] = None
    demand_pattern: Optional[str] = None
    forecast_method: Optional[str] = None
    created_po_id: Optional[int] = None
    created_po_number: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class RecommendationDecisionRequest(BaseModel):
    action: str = Field(..., description="Action: 'APPROVE' or 'DISMISS'")
    approved_qty: Optional[int] = Field(None, ge=1, description="Quantity approved (if different from suggested)")
    decision_note: Optional[str] = Field(None, description="Audit rationale for decision")
    actor_user_id: Optional[int] = Field(None, description="User performing decision")

class AIRunStatusResponse(BaseModel):
    id: int
    run_type: str
    status: str
    started_at: str
    finished_at: Optional[str]
    data_cutoff: str
    random_seed: int
    model_version: str
    recommendations_count: int
    error: Optional[str] = None
