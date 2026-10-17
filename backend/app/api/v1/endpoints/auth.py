from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.security import verify_password, create_access_token
from backend.app.core.auth import get_current_user
from backend.app.models.users import User
from backend.app.schemas.auth import LoginRequest, DemoLoginRequest, TokenResponse
from backend.app.schemas.users import UserResponse

router = APIRouter()

DEFAULT_DEMO_PASSWORD = "stocksense123"

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user via email and password, returning JWT access token.
    Default demo password for seeded accounts is 'stocksense123'.
    """
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if user.is_active != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    # Password verification: checks bcrypt hash if set, or matches default demo password
    is_valid = False
    if user.hashed_password:
        is_valid = verify_password(payload.password, user.hashed_password)
    else:
        is_valid = (payload.password == DEFAULT_DEMO_PASSWORD)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/demo-login", response_model=TokenResponse)
def demo_login(payload: DemoLoginRequest, db: Session = Depends(get_db)):
    """
    1-Click Demo Persona Login for recruiter evaluations and live walkthroughs.
    Allows immediate role switching without manual typing.
    """
    query = db.query(User).filter(User.is_active == 1)
    if payload.user_id:
        user = query.filter(User.id == payload.user_id).first()
    elif payload.role:
        user = query.filter(User.role == payload.role).first()
    else:
        user = query.first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active user found for the requested demo persona"
        )

    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Fetch profile of current authenticated user."""
    return UserResponse.model_validate(current_user)
