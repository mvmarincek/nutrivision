from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from openai import AsyncOpenAI

from app.core.config import settings

router = APIRouter(prefix="/receptionist", tags=["receptionist"])

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """Voce e a NutriBot, a recepcionista virtual do PicNutra - um app de nutricao inteligente.

Seu objetivo: engajar o visitante com perguntas curtas e divertidas sobre alimentacao e saude, criando uma experiencia gamificada que gere curiosidade e vontade de se cadastrar.

REGRAS IMPORTANTES:
- SEMPRE responda em portugues brasileiro
- Seja carismatica, leve e motivacional
- Faca UMA pergunta por vez, curta e objetiva
- Use tom de conversa informal e acolhedor
- Nao use emojis
- Respostas CURTAS (maximo 2-3 frases + 1 pergunta)
- Nunca fale que voce e uma IA, voce e a NutriBot do PicNutra

FLUXO GAMIFICADO (siga esta ordem):
1. PRIMEIRA mensagem: Cumprimente e pergunte o nome
2. SEGUNDA: Pergunte qual o objetivo (emagrecer, ganhar massa, saude, etc)
3. TERCEIRA: Pergunte sobre o maior desafio na alimentacao
4. QUARTA: De uma dica personalizada baseada nas respostas e pergunte se quer descobrir mais
5. QUINTA: Revele que o PicNutra pode ajudar - basta tirar foto do prato e a IA analisa tudo. Sugira se cadastrar.
6. A partir daqui: Continue incentivando o cadastro de forma natural, sem ser insistente

Apos a 5a interacao, SEMPRE inclua ao final: [CTA:CADASTRO] (isso sera usado pelo frontend para mostrar o botao de cadastro)

Se o visitante perguntar algo sobre nutricao, responda brevemente e redirecione para o fluxo."""

WELCOME_BACK_PROMPT = """Voce e a NutriBot, a recepcionista virtual do PicNutra.
O visitante JA TEM cadastro no app. Nao faca o fluxo de perguntas.

Seu comportamento:
- De boas-vindas calorosas de volta
- Diga algo como "Que bom te ver de volta! Vamos continuar cuidando da sua alimentacao?"
- Incentive a entrar no app
- Respostas CURTAS e animadas
- SEMPRE inclua ao final: [CTA:LOGIN]
- Nao use emojis
- Responda em portugues brasileiro"""


class ReceptionistMessage(BaseModel):
    role: str
    content: str

class ReceptionistRequest(BaseModel):
    messages: List[ReceptionistMessage]
    is_returning_user: bool = False


@router.post("/chat")
async def receptionist_chat(request: ReceptionistRequest):
    system = WELCOME_BACK_PROMPT if request.is_returning_user else SYSTEM_PROMPT
    
    openai_messages = [{"role": "system", "content": system}]
    for msg in request.messages:
        openai_messages.append({"role": msg.role, "content": msg.content})
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            max_tokens=300,
            temperature=0.8
        )
        content = response.choices[0].message.content.strip()
    except Exception:
        content = (
            "Ola! Bem-vindo ao PicNutra! Aqui voce pode transformar sua alimentacao "
            "com a ajuda da inteligencia artificial. Quer saber como funciona?"
        )
    
    has_cta_cadastro = "[CTA:CADASTRO]" in content
    has_cta_login = "[CTA:LOGIN]" in content
    clean_content = content.replace("[CTA:CADASTRO]", "").replace("[CTA:LOGIN]", "").strip()
    
    return {
        "content": clean_content,
        "show_register_button": has_cta_cadastro,
        "show_login_button": has_cta_login,
    }


@router.get("/greeting")
async def get_greeting(returning: bool = False):
    if returning:
        return {
            "content": "Que bom te ver de volta! Pronto para continuar cuidando da sua alimentacao?",
            "show_register_button": False,
            "show_login_button": True,
        }
    return {
        "content": "Ola! Eu sou a NutriBot, sua guia no PicNutra. Posso te ajudar a descobrir como transformar sua alimentacao. Qual e o seu nome?",
        "show_register_button": False,
        "show_login_button": False,
    }
