from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import Job
from app.schemas.schemas import JobResponse, QuestionItem
from app.core.security import get_current_user
from app.models.models import User

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    
    questions = None
    if job.status == "waiting_user" and job.questions:
        questions = [QuestionItem(**q) for q in job.questions]
    
    return JobResponse(
        id=job.id,
        status=job.status,
        etapa_atual=job.etapa_atual,
        questions=questions,
        resultado_final=job.resultado_final,
        erro=job.erro
    )
