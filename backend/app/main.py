from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, ensure_schema_migrations
import backend.app.models  # Ensure all 17 models are imported and registered
from backend.app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure all database tables exist and schema migrations applied
    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations(engine)
    yield
    # Shutdown logic if needed

show_docs = (settings.ENVIRONMENT.lower() != "production") and settings.DEBUG

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="StockSense AI-Assisted Inventory Management System Backend",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if show_docs else None,
    docs_url="/docs" if show_docs else None,
    redoc_url="/redoc" if show_docs else None,
    lifespan=lifespan,
)

# CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    )

# Include v1 API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": "0.1.0",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "status": "online",
    }
