import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BrandGuard AI API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./brandguard.db")
    EXTERNAL_AI_ENABLED: bool = os.getenv("EXTERNAL_AI_ENABLED", "true").lower() in ("true", "1")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "brandguard-super-secret-key-change-in-prod-2026")
    JWT_ALGORITHM: str = "HS256"
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()
