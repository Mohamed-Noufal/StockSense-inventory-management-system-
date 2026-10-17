from typing import Optional, Literal
from pydantic import BaseModel, EmailStr
from backend.app.schemas.users import UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class DemoLoginRequest(BaseModel):
    role: Optional[Literal["STOREKEEPER", "PROCUREMENT_OFFICER", "MANAGER", "ADMIN"]] = None
    user_id: Optional[int] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
