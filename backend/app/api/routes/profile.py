from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Profile
from app.schemas.schemas import ProfileCreate, ProfileResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    return ProfileResponse.model_validate(profile)

@router.post("", response_model=ProfileResponse)
async def create_or_update_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if profile:
        profile.objetivo = profile_data.objetivo
        profile.restricoes = profile_data.restricoes or []
        profile.alergias = profile_data.alergias or []
    else:
        profile = Profile(
            user_id=current_user.id,
            objetivo=profile_data.objetivo,
            restricoes=profile_data.restricoes or [],
            alergias=profile_data.alergias or []
        )
        db.add(profile)
    
    await db.commit()
    await db.refresh(profile)
    
    return ProfileResponse.model_validate(profile)
