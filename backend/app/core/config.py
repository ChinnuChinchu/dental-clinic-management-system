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


settings = Settings()