from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(env_file=".env")
    
    CLINIC_TIMEZONE: str = "Asia/Kolkata"
    CANCEL_CUTOFF_HOURS: int = 2
    MAX_ADVANCE_DAYS: int = 60
    
    REDIS_URL: str = "redis://localhost:6380/0"

    # Email: "console" prints to the worker log, "smtp" really sends
    EMAIL_BACKEND: str = "console"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "Bright Smile Dental <no-reply@example.com>"
    SMTP_TLS: bool = True

    # Used inside reminder messages
    CLINIC_NAME: str = "Bright Smile Dental"
    CLINIC_PHONE: str = "+91 98765 43210"
    CLINIC_ADDRESS: str = "Main Road, Thrissur, Kerala 680001"
    FRONTEND_URL: str = "http://localhost:5173"


settings = Settings()