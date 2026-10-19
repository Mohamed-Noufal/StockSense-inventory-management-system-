from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import hash_password, decode_access_token
from backend.app.core.auth import security_scheme
from backend.app.models.users import User
from backend.app.schemas.users import UserResponse, UserCreate

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).filter(User.is_active == 1).order_by(User.id.asc()).all()

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
):
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    user = db.query(User).filter(User.id == int(payload["sub"]), User.is_active == 1).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    return user

@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    payload: UserCreate,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
):
    norm_email = payload.email.lower().strip()
    existing = db.query(User).filter_by(email=norm_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already exists")

    req_role = payload.role.upper().strip()
    privileged_roles = {"ADMIN"}

    # Guard against unauthorized privilege escalation:
    # Only active ADMIN users can create accounts with ADMIN privileges.
    if req_role in privileged_roles:
        is_authorized_admin = False
        if credentials and credentials.credentials:
            token_payload = decode_access_token(credentials.credentials)
            if token_payload and token_payload.get("role") == "ADMIN":
                is_authorized_admin = True
        if not is_authorized_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Creating accounts with role '{req_role}' requires active administrator authentication."
            )

    hashed = hash_password(payload.password) if payload.password else hash_password("stocksense123")
    user = User(
        full_name=payload.full_name.strip(),
        email=norm_email,
        role=req_role,
        hashed_password=hashed,
        is_active=1
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
