from typing import Optional
from pydantic import BaseModel, ConfigDict

class AttachmentBase(BaseModel):
    entity_type: str  # 'MOVEMENT', 'PURCHASE_ORDER'
    entity_id: int
    filename: str
    file_type: str
    file_size_bytes: int
    description: Optional[str] = None
    uploaded_by_user_id: Optional[int] = None
    uploaded_by_name: Optional[str] = None

class AttachmentCreate(AttachmentBase):
    file_path: str

class AttachmentResponse(AttachmentBase):
    id: int
    created_at: str
    download_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
