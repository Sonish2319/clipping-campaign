from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "YouTube Campaign Marketplace"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # Security & Tokens
    SECRET_KEY: str = "dev_secret_key_change_me_super_secure_and_long_jwt_signing_key_32chars!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FERNET_ENCRYPTION_KEY: str = "dGhpcy1pcy1hLXNhbXBsZS1mZXJuZXQta2V5LTMyYnl0ZXM9"

    # Database
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "campaign_db"
    MYSQL_USER: str = "campaign_user"
    MYSQL_PASSWORD: str = "campaign_password"
    DATABASE_URL: Optional[str] = None

    # Redis & Celery
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Google OAuth & YouTube
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/callback"
    YOUTUBE_OAUTH_REDIRECT_URI: str = "http://localhost:3000/editor/channels/callback"
    YOUTUBE_API_KEY: str = ""

    # Superadmin Defaults
    SUPERADMIN_EMAIL: str = "admin@campaignmarketplace.com"
    SUPERADMIN_NAME: str = "System Superadmin"
    SUPERADMIN_PASSWORD: str = "AdminSecretPass123!"

    # Polling frequency
    VIDEO_POLLING_INTERVAL_MINUTES: int = 3

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"


settings = Settings()
