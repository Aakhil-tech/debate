from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://your-frontend-domain.com",
    ]

    DB_BACKEND: str = "postgres"
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/debate_win"

    UPLOAD_DIR: str = "/data/uploads"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_VISION_MODEL: str = "llama-3.2-90b-vision-preview"
    GROQ_MAX_TOKENS: int = 1500

    CREDITS_FORENSIC_ANALYSIS: int = 3
    CREDITS_FUMBLE_ANALYSIS: int = 1
    CREDITS_SPARRING_TURN: int = 1
    CREDITS_NEW_USER_BONUS: int = 20

    RATE_LIMIT_PER_MINUTE: int = 30
    RATE_LIMIT_AI_PER_MINUTE: int = 10

    STORAGE_BUCKET: str = "receipts"
    MAX_UPLOAD_MB: int = 10

    ZERO_LOG_RETENTION: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
