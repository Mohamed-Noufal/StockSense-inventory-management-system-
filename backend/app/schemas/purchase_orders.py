from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

class SupplierResponse(BaseModel):
    id: int
    name: str
    country: Optional[str] = None
    contact_email: Optional[str] = None
    is_import: int
    is_active: int
    model_config = ConfigDict(from_attributes=True)

class POLineCreate(BaseModel):
    item_id: int
    destination_location_id: int
    qty_ordered: int = Field(gt=0, description="Must be greater than 0")
    unit_price_minor: int = Field(ge=0, description="Unit cost in minor units (cents)")

class POCreate(BaseModel):
    supplier_id: int
    po_number: Optional[str] = None
    expected_date: Optional[str] = None
    notes: Optional[str] = None
    source_recommendation_id: Optional[int] = None
    lines: List[POLineCreate] = Field(min_length=1, description="At least one line is required")

class POReceivePayload(BaseModel):
    po_line_id: int
    quantity_received: int = Field(gt=0, description="Quantity being received in this delivery")
    destination_location_id: Optional[int] = None
    idempotency_key: Optional[str] = None
    actor_label: str = "Storekeeper"

class POLineResponse(BaseModel):
    id: int
    po_id: int
    item_id: int
    destination_location_id: int
    qty_ordered: int
    qty_received: int
    remaining_quantity: int = 0
    unit_price_minor: int
    created_at: str
    item_sku: Optional[str] = None
    item_name: Optional[str] = None
    location_code: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class POResponse(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    supplier_name: Optional[str] = None
    status: str
    created_at: str
    order_date: Optional[str] = None
    expected_date: Optional[str] = None
    notes: Optional[str] = None
    source_recommendation_id: Optional[int] = None
    lines: List[POLineResponse] = []
    total_lines: int = 0
    total_amount_minor: int = 0
    model_config = ConfigDict(from_attributes=True)
