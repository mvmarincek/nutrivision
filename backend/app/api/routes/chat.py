from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional
from openai import AsyncOpenAI

from app.db.database import get_db
from app.models.models import User, Profile, ChatConversation, ChatMessage
from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = (
    "Voce e a Nutra, nutricionista virtual do PicNutra. Voce tem amplo conhecimento em nutricao clinica, "
    "esportiva e funcional. Voce e carismatica, acolhedora e objetiva.\n\n"
    "REGRAS:\n"
    "- Responda sempre em portugues brasileiro\n"
    "- Seja empatica, acolhedora e profissional\n"
    "- Use linguagem acessivel, evitando jargoes tecnicos desnecessarios\n"
    "- Baseie suas respostas em consensos cientificos consolidados (ex: diretrizes da OMS, SBN, ACSM). "
    "NAO invente referencias, artigos ou numeros de DOI. Se nao tiver certeza de uma fonte especifica, "
    "diga 'segundo consensos cientificos' em vez de citar uma referencia falsa\n"
    "- SEMPRE inclua ao final de respostas sobre diagnosticos ou tratamentos: "
    "'Lembre-se: esta orientacao nao substitui a consulta com um nutricionista ou medico.'\n"
    "- Nao faca diagnosticos medicos\n"
    "- Nao receite medicamentos\n"
    "- Personalize as respostas com base no perfil do usuario quando disponivel\n"
    "- Seja concisa mas completa nas respostas\n"
    "- Nao use emojis\n"
    "- Quando o usuario perguntar algo fora do escopo de nutricao/saude, redirecione educadamente"
)


class SendMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None


async def get_user_profile_context(user: User, db: AsyncSession) -> str:
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        return ""
    
    parts = []
    if user.name:
        parts.append(f"Nome: {user.name.split()[0]}")
    if profile.objetivo:
        parts.append(f"Objetivo: {profile.objetivo}")
    if profile.restricoes:
        parts.append(f"Restricoes: {', '.join(profile.restricoes)}")
    if profile.alergias:
        parts.append(f"Alergias: {', '.join(profile.alergias)}")
    
    if parts:
        return "\n\nPerfil do usuario:\n" + "\n".join(parts)
    return ""


@router.get("/conversations")
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.plan != "premium":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A IA Nutricionista está disponível apenas no plano Premium."
        )
    
    result = await db.execute(
        select(ChatConversation)
        .where(ChatConversation.user_id == current_user.id)
        .order_by(ChatConversation.updated_at.desc())
        .limit(50)
    )
    conversations = result.scalars().all()
    
    return [
        {
            "id": c.id,
            "title": c.title or "Nova conversa",
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in conversations
    ]


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.plan != "premium":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A IA Nutricionista está disponível apenas no plano Premium."
        )
    
    result = await db.execute(
        select(ChatConversation).where(
            and_(
                ChatConversation.id == conversation_id,
                ChatConversation.user_id == current_user.id
            )
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa nao encontrada")
    
    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = msg_result.scalars().all()
    
    return {
        "id": conversation.id,
        "title": conversation.title or "Nova conversa",
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ]
    }


@router.post("/send")
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.plan != "premium":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A IA Nutricionista está disponível apenas no plano Premium."
        )
    
    conversation = None
    if request.conversation_id:
        result = await db.execute(
            select(ChatConversation).where(
                and_(
                    ChatConversation.id == request.conversation_id,
                    ChatConversation.user_id == current_user.id
                )
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversa nao encontrada")
    
    if not conversation:
        title = request.message[:80] if len(request.message) > 80 else request.message
        conversation = ChatConversation(
            user_id=current_user.id,
            title=title
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
    
    user_msg = ChatMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.message
    )
    db.add(user_msg)
    await db.commit()
    
    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation.id)
        .order_by(ChatMessage.created_at.asc())
    )
    all_messages = msg_result.scalars().all()
    
    profile_context = await get_user_profile_context(current_user, db)
    system_content = SYSTEM_PROMPT + profile_context
    
    openai_messages = [{"role": "system", "content": system_content}]
    for msg in all_messages:
        openai_messages.append({"role": msg.role, "content": msg.content})
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            max_tokens=1000,
            temperature=0.7
        )
        assistant_content = response.choices[0].message.content.strip()
    except Exception:
        assistant_content = (
            "Desculpe, estou com dificuldades tecnicas no momento. "
            "Por favor, tente novamente em alguns instantes."
        )
    
    assistant_msg = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=assistant_content
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)
    
    return {
        "conversation_id": conversation.id,
        "message": {
            "id": assistant_msg.id,
            "role": "assistant",
            "content": assistant_content,
            "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else None,
        }
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.plan != "premium":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A IA Nutricionista está disponível apenas no plano Premium."
        )
    
    result = await db.execute(
        select(ChatConversation).where(
            and_(
                ChatConversation.id == conversation_id,
                ChatConversation.user_id == current_user.id
            )
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa nao encontrada")
    
    await db.execute(
        ChatMessage.__table__.delete().where(ChatMessage.conversation_id == conversation_id)
    )
    await db.delete(conversation)
    await db.commit()
    
    return {"success": True}
