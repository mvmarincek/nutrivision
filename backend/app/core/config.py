from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://localhost/picnutra"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    OPENAI_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "https://picnutra-api.onrender.com"
    UPLOAD_DIR: str = "./uploads"
    
    ASAAS_API_KEY: str = ""
    ASAAS_WALLET_ID: str = ""
    ASAAS_BASE_URL: str = "https://api.asaas.com/v3"
    ASAAS_WEBHOOK_TOKEN: str = ""
    
    RESEND_API_KEY: str = ""
    
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    TRIAL_MAX_DAYS: int = 7
    
    BASIC_MONTHLY_PRICE: int = 990
    PRO_MONTHLY_PRICE: int = 1990
    PREMIUM_MONTHLY_PRICE: int = 4990
    
    BASIC_MONTHLY_SIMPLE: int = 30
    PRO_MONTHLY_FULL: int = 30
    PREMIUM_MONTHLY_FULL: int = 60
    
    class Config:
        env_file = ".env"
        extra = "allow"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
