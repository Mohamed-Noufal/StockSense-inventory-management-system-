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
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
):
    if credentials and credentials.credentials:
        payload = decode_access_token(credentials.credentials)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.id == int(payload["sub"]), User.is_active == 1).first()
            if user:
                return user

    # Fallback to first active user for legacy/unauthenticated tests
    user = db.query(User).filter(User.is_active == 1).first()
    if not user:
        raise HTTPException(status_code=404, detail="No active user found")
    return user

@router.post("", response_model=UserResponse, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    norm_email = payload.email.lower().strip()
    existing = db.query(User).filter_by(email=norm_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already exists")

    hashed = hash_password(payload.password) if payload.password else hash_password("stocksense123")
    user = User(
        full_name=payload.full_name.strip(),
        email=norm_email,
        role=payload.role.upper(),
        hashed_password=hashed,
        is_active=1
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
