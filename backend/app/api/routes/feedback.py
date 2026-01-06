from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

router = APIRouter(prefix="/feedback", tags=["feedback"])

class FeedbackRequest(BaseModel):
    tipo: str
    mensagem: str

@router.post("")
async def send_feedback(
    feedback: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        destinatario = "mvmarincek@gmail.com"
        
        tipo_emoji = {
            "sugestao": "💡",
            "bug": "🐛", 
            "elogio": "⭐",
            "outro": "📝"
        }.get(feedback.tipo, "📝")
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #22c55e, #14b8a6); padding: 20px; border-radius: 15px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0;">🥗 Nutri-Vision</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Feedback do Usuário</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 15px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0;"><strong>Tipo:</strong> {tipo_emoji} {feedback.tipo.capitalize()}</p>
                <p style="margin: 0 0 10px 0;"><strong>Usuário:</strong> {current_user.email}</p>
                <p style="margin: 0 0 10px 0;"><strong>ID:</strong> {current_user.id}</p>
                <p style="margin: 0;"><strong>Plano:</strong> {current_user.plan}</p>
            </div>
            
            <div style="background: white; border: 2px solid #e2e8f0; border-radius: 15px; padding: 20px;">
                <h3 style="color: #22c55e; margin: 0 0 15px 0;">Mensagem:</h3>
                <p style="color: #334155; line-height: 1.6; margin: 0; white-space: pre-wrap;">{feedback.mensagem}</p>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
                Enviado via Nutri-Vision App
            </p>
        </body>
        </html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"{tipo_emoji} Feedback Nutri-Vision: {feedback.tipo.capitalize()}"
        msg['From'] = "noreply@nutrivision.app"
        msg['To'] = destinatario
        
        msg.attach(MIMEText(html_content, 'html'))
        
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASS", "")
        
        if smtp_user and smtp_pass:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, destinatario, msg.as_string())
        else:
            print(f"[FEEDBACK] De: {current_user.email}")
            print(f"[FEEDBACK] Tipo: {feedback.tipo}")
            print(f"[FEEDBACK] Mensagem: {feedback.mensagem}")
        
        return {"success": True, "message": "Feedback enviado com sucesso!"}
        
    except Exception as e:
        print(f"Erro ao enviar feedback: {e}")
        return {"success": True, "message": "Feedback recebido!"}
