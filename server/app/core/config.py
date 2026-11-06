"""
Core Configuration Module for BudgetBuddy.

This module centralizes application settings such as database connection URLs,
JWT secret keys, and CORS configurations. It loads values from environment
variables or .env files, providing safe fallback defaults for local development.
"""

import os
from typing import List
from pathlib import Path

# Base directory pointing to the server root
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Attempt to load .env file manually if python-dotenv is not installed
env_file_path = BASE_DIR / ".env"
if env_file_path.exists():
    try:
        with open(env_file_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key not in os.environ:
                        os.environ[key] = val
    except Exception:
        pass


class Settings:
    PROJECT_NAME: str = "BudgetBuddy API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database Configuration:
    # Supports both SQLite and PostgreSQL. If DATABASE_URL starts with postgres://,
    # SQLAlchemy 1.4+ / 2.0+ requires postgresql://.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./budgetbuddy.db")

    # Security & JWT Configuration
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "budgetbuddy_dev_secret_key_change_in_production_12345"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # CORS Allowed Origins
    _raw_cors: str = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    )

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self._raw_cors.split(",") if origin.strip()]

    def get_sqlalchemy_database_url(self) -> str:
        """
        Normalize Postgres URL if needed (e.g., Heroku or older connection strings).
        """
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url


# Singleton instance for access throughout the application
settings = Settings()

