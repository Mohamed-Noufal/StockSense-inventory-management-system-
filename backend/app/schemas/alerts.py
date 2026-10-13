from typing import Optional
from pydantic import BaseModel, ConfigDict

class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alert_type: str
    severity: str
    item_id: Optional[int] = None
    item_sku: Optional[str] = None
    item_name: Optional[str] = None
    location_id: Optional[int] = None
    location_code: Optional[str] = None
    movement_id: Optional[int] = None
    source_run_id: Optional[int] = None
    message: str
    details_json: Optional[str] = None
    status: str
    created_at: str
    acknowledged_by_user_id: Optional[int] = None
    acknowledged_by_name: Optional[str] = None
    acknowledged_at: Optional[str] = None
    resolved_by_user_id: Optional[int] = None
    resolved_by_name: Optional[str] = None
    resolved_at: Optional[str] = None

class AlertAcknowledgeRequest(BaseModel):
    user_id: Optional[int] = None
    notes: Optional[str] = None

class AlertResolveRequest(BaseModel):
    user_id: Optional[int] = None
    resolution_notes: Optional[str] = None
