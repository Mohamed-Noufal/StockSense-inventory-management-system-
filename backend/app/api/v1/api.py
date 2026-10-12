from fastapi import APIRouter
from backend.app.api.v1.endpoints import health
from backend.ai.router import router as ai_router

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health & System"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI & Replenishment"])
