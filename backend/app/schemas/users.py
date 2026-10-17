from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, Literal

RoleType = Literal["STOREKEEPER", "PROCUREMENT_OFFICER", "MANAGER", "ADMIN"]

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: str
    is_active: int
    created_at: str
    updated_at: str

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    role: RoleType
    password: Optional[str] = None
