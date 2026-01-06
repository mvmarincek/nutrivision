from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.db.database import init_db
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
