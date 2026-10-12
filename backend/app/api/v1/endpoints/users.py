from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.users import User
from backend.app.schemas.users import UserResponse, UserCreate

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).filter(User.is_active == 1).order_by(User.id.asc()).all()

@router.get("/me", response_model=UserResponse)
def get_current_user(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.is_active == 1).first()
    if not user:
        raise HTTPException(status_code=404, detail="No active user found")
    return user

@router.post("", response_model=UserResponse, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter_by(email=payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already exists")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        role=payload.role.upper(),
        is_active=1
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
