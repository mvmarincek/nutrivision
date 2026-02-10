from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date
from openai import AsyncOpenAI

from app.db.database import get_db
from app.models.models import User, Profile, Meal, MealAnalysis, MotivationalPost
from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/motivacional", tags=["motivacional"])

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def get_user_context(user: User, db: AsyncSession) -> str:
    parts = []
    
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile:
        if profile.objetivo:
            parts.append(f"Objetivo: {profile.objetivo}")
        if profile.restricoes:
            parts.append(f"Restricoes alimentares: {', '.join(profile.restricoes)}")
        if profile.alergias:
            parts.append(f"Alergias: {', '.join(profile.alergias)}")
    
    result = await db.execute(
        select(Meal, MealAnalysis)
        .join(MealAnalysis, MealAnalysis.meal_id == Meal.id, isouter=True)
        .where(Meal.user_id == user.id)
        .order_by(Meal.created_at.desc())
        .limit(5)
    )
    recent_meals = result.all()
    
    if recent_meals:
        meal_items = []
        for meal, analysis in recent_meals:
            if analysis and analysis.itens_identificados:
                items = analysis.itens_identificados
                if isinstance(items, list):
                    meal_items.extend(items[:3])
        if meal_items:
            parts.append(f"Alimentos recentes: {', '.join(meal_items[:10])}")
    
    if not parts:
        parts.append("Usuario novo, sem perfil detalhado ainda")
    
    return ". ".join(parts)


@router.get("/today")
async def get_today_post(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = date.today()
    
    result = await db.execute(
        select(MotivationalPost).where(
            and_(
                MotivationalPost.user_id == user.id,
                MotivationalPost.post_date == today
            )
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        return {
            "id": existing.id,
            "content": existing.content,
            "image_url": existing.image_url,
            "date": str(existing.post_date)
        }
    
    user_context = await get_user_context(user, db)
    user_name = user.name.split()[0] if user.name else "amigo(a)"
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Voce e a Nutra, mascote e nutricionista motivacional do PicNutra. "
                        "Voce e carismatica, acolhedora e fala como uma amiga proxima que entende de nutricao.\n\n"
                        "TAREFA: Crie um post motivacional curto (3-4 paragrafos) personalizado para o usuario.\n\n"
                        "REGRAS:\n"
                        "- Chame o usuario pelo primeiro nome\n"
                        "- Conecte a motivacao ao objetivo e contexto alimentar do usuario\n"
                        "- Inclua 1 dica pratica e aplicavel ao dia a dia\n"
                        "- Use tom de conversa, como se estivesse mandando mensagem para um amigo\n"
                        "- Varie o estilo: as vezes comece com uma pergunta, as vezes com um fato curioso, as vezes com um elogio\n"
                        "- Nao use emojis\n"
                        "- Nao use titulos ou formatacao markdown\n"
                        "- Responda APENAS com o texto do post"
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Nome do usuario: {user_name}\n"
                        f"Data: {today.strftime('%d/%m/%Y')}\n"
                        f"Contexto: {user_context}\n\n"
                        f"Crie um post motivacional personalizado sobre nutricao e saude para hoje."
                    )
                }
            ],
            max_tokens=500,
            temperature=0.8
        )
        content = response.choices[0].message.content.strip()
    except Exception:
        content = (
            f"Ola, {user_name}! Hoje e um novo dia para cuidar da sua saude.\n\n"
            "Lembre-se: cada refeicao e uma oportunidade de nutrir seu corpo com o que ele merece. "
            "Pequenas escolhas diarias fazem grandes diferencas ao longo do tempo.\n\n"
            "Que tal comecar o dia com um copo de agua e uma refeicao equilibrada? "
            "Seu corpo vai agradecer!"
        )
    
    post = MotivationalPost(
        user_id=user.id,
        post_date=today,
        content=content
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    
    return {
        "id": post.id,
        "content": post.content,
        "image_url": post.image_url,
        "date": str(post.post_date)
    }


@router.get("/history")
async def get_post_history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MotivationalPost)
        .where(MotivationalPost.user_id == user.id)
        .order_by(MotivationalPost.post_date.desc())
        .limit(30)
    )
    posts = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "content": p.content,
            "image_url": p.image_url,
            "date": str(p.post_date)
        }
        for p in posts
    ]
