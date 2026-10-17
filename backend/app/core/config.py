import os
from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator

# Authoritative project root (directory containing backend, frontend, data)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    PROJECT_NAME: str = "StockSense AI Inventory System"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # SQLite Database Configuration
    DATABASE_URL: Optional[str] = None
    SQLITE_DATABASE_PATH: Optional[str] = None
    SQLITE_TIMEOUT: float = 15.0
    
    # Document Attachments Directory
    ATTACHMENTS_DIR: str = "data/attachments"

    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CORS_ALLOWED_ORIGINS: Optional[Union[str, List[str]]] = None
    
    # Authentication & Security
    SECRET_KEY: str = "stocksense-super-secret-jwt-key-2026-oilfield-production-safe"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Defaults
    DEFAULT_WAREHOUSE_CODE: str = "WH-01"
    SYNTHETIC_DATA_SEED: int = 42

    @model_validator(mode="after")
    def assemble_settings(self) -> "Settings":
        # Resolve DATABASE_URL from SQLITE_DATABASE_PATH if not explicitly provided
        if not self.DATABASE_URL:
            if self.SQLITE_DATABASE_PATH:
                path = self.SQLITE_DATABASE_PATH
                if not os.path.isabs(path):
                    path = os.path.join(PROJECT_ROOT, path)
                self.DATABASE_URL = f"sqlite:///{path}"
            else:
                default_db = os.path.join(PROJECT_ROOT, "data/stocksense.db")
                self.DATABASE_URL = f"sqlite:///{default_db}"

        # Resolve ATTACHMENTS_DIR to absolute path
        if not os.path.isabs(self.ATTACHMENTS_DIR):
            self.ATTACHMENTS_DIR = os.path.join(PROJECT_ROOT, self.ATTACHMENTS_DIR)

        # Merge CORS_ALLOWED_ORIGINS if provided
        if self.CORS_ALLOWED_ORIGINS:
            if isinstance(self.CORS_ALLOWED_ORIGINS, str):
                origins = [orig.strip() for orig in self.CORS_ALLOWED_ORIGINS.split(",") if orig.strip()]
            else:
                origins = [orig.strip() for orig in self.CORS_ALLOWED_ORIGINS if orig.strip()]
            for orig in origins:
                if orig not in self.BACKEND_CORS_ORIGINS:
                    self.BACKEND_CORS_ORIGINS.append(orig)

        # In production, default DEBUG to False unless explicitly overridden
        if self.ENVIRONMENT.lower() == "production" and "DEBUG" not in os.environ:
            self.DEBUG = False

        return self

settings = Settings()

