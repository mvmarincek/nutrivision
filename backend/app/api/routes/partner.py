from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Commission, Payment, Referral
from app.schemas.schemas import PartnerDashboardResponse, WithdrawRequest, UpdatePixKeyRequest
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/partner", tags=["partner"])

async def get_pj_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/dashboard")
async def partner_dashboard(
    partner: User = Depends(get_pj_user),
    db: AsyncSession = Depends(get_db)
):
    total_referred = await db.scalar(
        select(func.count(Referral.id)).where(Referral.referrer_id == partner.id)
    ) or 0
    
    total_revenue = await db.scalar(
        select(func.sum(Commission.payment_amount)).where(Commission.partner_id == partner.id)
    ) or 0.0
    
    total_commission = await db.scalar(
        select(func.sum(Commission.commission_amount)).where(Commission.partner_id == partner.id)
    ) or 0.0
    
    pending = await db.scalar(
        select(func.count(Commission.id)).where(
            Commission.partner_id == partner.id,
            Commission.status == "pending"
        )
    ) or 0
    
    paid = await db.scalar(
        select(func.count(Commission.id)).where(
            Commission.partner_id == partner.id,
            Commission.status == "paid"
        )
    ) or 0
    
    return {
        "total_referred": total_referred,
        "total_revenue_generated": float(total_revenue),
        "total_commission_earned": float(total_commission),
        "commission_balance": float(partner.commission_balance or 0),
        "commission_rate": partner.commission_rate or (0.30 if partner.user_type == "pj" else 0.10),
        "pending_commissions": pending,
        "paid_commissions": paid,
        "referral_code": partner.referral_code,
        "pix_key": partner.pix_key
    }

@router.get("/commissions")
async def partner_commissions(
    partner: User = Depends(get_pj_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Commission)
        .where(Commission.partner_id == partner.id)
        .order_by(Commission.created_at.desc())
    )
    commissions = result.scalars().all()
    
    items = []
    for c in commissions:
        user_result = await db.execute(select(User).where(User.id == c.referred_user_id))
        referred_user = user_result.scalar_one_or_none()
        items.append({
            "id": c.id,
            "referred_user_name": referred_user.name if referred_user else None,
            "referred_user_email": referred_user.email if referred_user else "Unknown",
            "payment_amount": c.payment_amount,
            "commission_amount": c.commission_amount,
            "status": c.status,
            "created_at": c.created_at.isoformat()
        })
    
    return {"commissions": items}

@router.post("/update-pix-key")
async def update_pix_key(
    data: UpdatePixKeyRequest,
    partner: User = Depends(get_pj_user),
    db: AsyncSession = Depends(get_db)
):
    partner.pix_key = data.pix_key
    await db.commit()
    return {"message": "Chave PIX atualizada com sucesso", "pix_key": partner.pix_key}

@router.post("/withdraw")
async def request_withdrawal(
    data: WithdrawRequest,
    partner: User = Depends(get_pj_user),
    db: AsyncSession = Depends(get_db)
):
    if (partner.commission_balance or 0) < 10.0:
        raise HTTPException(status_code=400, detail="Saldo minimo para saque e R$10,00")
    
    partner.pix_key = data.pix_key
    
    withdrawal_amount = partner.commission_balance
    
    result = await db.execute(
        select(Commission).where(
            Commission.partner_id == partner.id,
            Commission.status == "pending"
        )
    )
    pending_commissions = result.scalars().all()
    for c in pending_commissions:
        c.status = "withdrawal_requested"
    
    await db.commit()
    
    logger.info(f"[withdraw] Partner {partner.id} requested withdrawal of R${withdrawal_amount:.2f} to PIX {data.pix_key}")
    
    return {
        "message": f"Solicitacao de saque de R${withdrawal_amount:.2f} registrada com sucesso",
        "amount": withdrawal_amount,
        "pix_key": data.pix_key,
        "status": "requested"
    }
