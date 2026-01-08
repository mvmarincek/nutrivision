from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
import os

from app.db.database import init_db, async_session
from app.core.config import settings
from app.api.routes import auth, profile, meals, jobs, billing, credits, feedback

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(
    title="Nutri-Vision API",
    description="API para análise nutricional de refeições com IA",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(meals.router)
app.include_router(jobs.router)
app.include_router(billing.router)
app.include_router(credits.router)
app.include_router(feedback.router)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
async def root():
    return {"message": "Nutri-Vision API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/run-migration")
async def run_migration():
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(64)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_referral_code ON users(referral_code)",
    ]
    
    results = []
    async with async_session() as session:
        for sql in migrations:
            try:
                await session.execute(text(sql))
                await session.commit()
                results.append({"sql": sql, "status": "ok"})
            except Exception as e:
                results.append({"sql": sql, "status": "error", "error": str(e)})
    
    return {"migrations": results}
