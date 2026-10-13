from fastapi import APIRouter
from backend.app.api.v1.endpoints import health, inventory, purchase_orders, users, alerts, attachments
from backend.ai.router import router as ai_router

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health & System"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory & Ledger"])
api_router.include_router(purchase_orders.router, prefix="/po", tags=["Procurement & POs"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI & Replenishment"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Employee Directory"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts & Exceptions"])
api_router.include_router(attachments.router, prefix="/attachments", tags=["Document Attachments & Proof"])


