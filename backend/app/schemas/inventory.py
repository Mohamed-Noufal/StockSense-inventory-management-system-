from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any

class ItemBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category_id: int
    uom: str = "pcs"
    unit_cost_minor: int = 0
    criticality: str = "STANDARD"

class ItemResponse(ItemBase):
    id: int
    is_active: int
    total_on_hand: int = 0
    model_config = ConfigDict(from_attributes=True)

class LocationResponse(BaseModel):
    id: int
    code: str
    name: str
    location_type: str
    is_default_replenishment: int
    is_active: int
    model_config = ConfigDict(from_attributes=True)

class StockBalanceResponse(BaseModel):
    item_id: int
    location_id: int
    quantity_on_hand: int
    updated_at: str
    item_sku: Optional[str] = None
    item_name: Optional[str] = None
    location_code: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class MovementCreate(BaseModel):
    item_id: int
    location_id: int
    movement_type: str = Field(description="RECEIPT, ISSUE, or ADJUSTMENT")
    quantity: int = Field(gt=0, description="Positive quantity (sign is handled by service)")
    project_id: Optional[int] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    reason: Optional[str] = None
    idempotency_key: Optional[str] = None
    actor_label: str = "Storekeeper"

class TransferCreate(BaseModel):
    item_id: int
    from_location_id: int
    to_location_id: int
    quantity: int = Field(gt=0, description="Transfer quantity")
    reason: Optional[str] = "Inter-location inventory transfer"
    idempotency_key: Optional[str] = None
    actor_label: str = "Storekeeper"

class MovementResponse(BaseModel):
    id: int
    item_id: int
    location_id: int
    movement_type: str
    quantity: int
    project_id: Optional[int] = None
    transfer_group_id: Optional[str] = None
    reason: Optional[str] = None
    actor_label: str
    occurred_at: str
    item_sku: Optional[str] = None
    location_code: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class IntegrityCheckResponse(BaseModel):
    status: str
    total_items_checked: int
    total_locations_checked: int
    mismatches_count: int
    mismatches: List[Dict[str, Any]] = []
    timestamp: str
