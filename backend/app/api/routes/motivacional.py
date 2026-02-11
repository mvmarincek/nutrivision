from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date, datetime, timezone, timedelta
import logging
import traceback

from app.db.database import get_db
from app.models.models import User, Profile, Meal, MealAnalysis, MotivationalPost
from app.core.security import get_current_user
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/motivacional", tags=["motivacional"])

BR_TZ = timezone(timedelta(hours=-3))

FALLBACK_MESSAGES = [
    "Cada refeicao e uma oportunidade de nutrir seu corpo com carinho. Nao importa se ontem nao foi perfeito, o que importa e o proximo passo que voce vai dar agora.\n\nUma dica simples para hoje: tente incluir pelo menos uma fruta ou verdura a mais no seu prato. Pequenas mudancas somam grandes resultados ao longo do tempo.\n\nVoce esta no caminho certo so por estar aqui. Continue firme!",
    "Sabia que o simples ato de prestar atencao no que voce come ja e um passo enorme? A maioria das pessoas come no piloto automatico, mas voce nao.\n\nHoje, tente mastigar mais devagar e sentir o sabor de cada alimento. Isso ajuda na digestao e na saciedade.\n\nCuidar de si mesmo e um ato de coragem. E voce esta fazendo isso todos os dias.",
    "Seu corpo e o unico lugar onde voce vai morar para sempre. Que tal investir nele com mais carinho hoje?\n\nUma sugestao pratica: beba um copo de agua agora mesmo. A hidratacao e a base de tudo - energia, disposicao, pele bonita e ate bom humor.\n\nLembre-se: progresso, nao perfeicao. Voce ja esta melhor do que ontem.",
    "Alimentacao saudavel nao precisa ser complicada. As vezes, a refeicao mais simples e a mais nutritiva.\n\nExperimente hoje preparar algo com ingredientes frescos e poucos temperos. Voce vai se surpreender com o sabor natural dos alimentos.\n\nO importante e ser consistente, nao perfeito. Um dia de cada vez, voce chega la.",
]


async def get_user_context(user: User, db: AsyncSession) -> str:
    parts = []

    try:
        result = await db.execute(select(Profile).where(Profile.user_id == user.id))
        profile = result.scalar_one_or_none()
        if profile:
            if profile.objetivo:
                parts.append(f"Objetivo: {profile.objetivo}")
            if profile.restricoes:
                parts.append(f"Restricoes alimentares: {', '.join(profile.restricoes)}")
            if profile.alergias:
                parts.append(f"Alergias: {', '.join(profile.alergias)}")
    except Exception as e:
        logger.error(f"Erro ao buscar profile: {e}")

    try:
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
                        for item in items[:3]:
                            if isinstance(item, dict):
                                meal_items.append(item.get('nome', str(item)))
                            elif isinstance(item, str):
                                meal_items.append(item)
            if meal_items:
                parts.append(f"Alimentos recentes: {', '.join(meal_items[:10])}")
    except Exception as e:
        logger.error(f"Erro ao buscar meals: {e}")

    if not parts:
        parts.append("Usuario novo, sem perfil detalhado ainda")

    return ". ".join(parts)


@router.get("/today")
async def get_today_post(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = datetime.now(BR_TZ).date()

    try:
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
    except Exception as e:
        logger.error(f"Erro ao buscar post existente: {e}")

    user_name = user.name.split()[0] if user.name else "amigo(a)"
    content = None

    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, timeout=15.0)

            user_context = await get_user_context(user, db)

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
        except Exception as e:
            logger.error(f"Erro OpenAI motivacional: {e}\n{traceback.format_exc()}")

    if not content:
        import hashlib
        seed = hashlib.md5(f"{user.id}-{today}".encode()).hexdigest()
        idx = int(seed, 16) % len(FALLBACK_MESSAGES)
        content = f"Ola, {user_name}!\n\n{FALLBACK_MESSAGES[idx]}"

    try:
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
    except Exception as e:
        logger.error(f"Erro ao salvar post motivacional: {e}")
        await db.rollback()
        return {
            "id": 0,
            "content": content,
            "image_url": None,
            "date": str(today)
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
