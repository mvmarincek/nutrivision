from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import json
import httpx
import logging
import traceback

from app.db.database import get_db
from app.models.models import User, Payment, ErrorLog, Commission
from app.core.security import get_current_user
from app.core.config import settings
from app.services.asaas_service import asaas_service, AsaasError
from app.services.email_service import send_upgraded_to_pro_email, send_subscription_cancelled_email, send_subscription_renewed_email, flush_email_logs
from datetime import datetime

logger = logging.getLogger(__name__)

async def log_billing_error(
    db: AsyncSession,
    error_type: str,
    error_message: str,
    user_id: Optional[int] = None,
    extra_data: Optional[dict] = None
):
    try:
        error_log = ErrorLog(
            user_id=user_id,
            error_type=f"billing_{error_type}",
            error_message=error_message[:1000],
            error_stack=traceback.format_exc()[:2000] if traceback.format_exc() else None,
            extra_data=json.dumps(extra_data) if extra_data else None
        )
        db.add(error_log)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to log billing error: {e}")

router = APIRouter(prefix="/billing", tags=["billing"])

class CreateProSubscriptionRequest(BaseModel):
    billing_type: str
    plan_type: str = "basic"
    card_holder_name: Optional[str] = None
    card_number: Optional[str] = None
    expiry_month: Optional[str] = None
    expiry_year: Optional[str] = None
    cvv: Optional[str] = None
    holder_cpf: Optional[str] = None
    holder_phone: Optional[str] = None
    postal_code: Optional[str] = None
    address_number: Optional[str] = None

class PaymentStatusResponse(BaseModel):
    status: str
    confirmed: bool

class BillingStatusResponse(BaseModel):
    plan: str
    trial_days_used: int
    simple_analyses_used: int
    full_analyses_used: int
    has_subscription: bool

@router.get("/status", response_model=BillingStatusResponse)
async def get_billing_status(current_user: User = Depends(get_current_user)):
    return BillingStatusResponse(
        plan=current_user.plan,
        trial_days_used=current_user.trial_days_used or 0,
        simple_analyses_used=current_user.simple_analyses_used or 0,
        full_analyses_used=current_user.full_analyses_used or 0,
        has_subscription=bool(current_user.asaas_subscription_id)
    )

async def get_or_create_customer(user: User, db: AsyncSession, cpf: Optional[str] = None):
    if cpf and not user.cpf:
        user.cpf = cpf
    
    if user.asaas_customer_id:
        try:
            if cpf:
                await asaas_service.update_customer(user.asaas_customer_id, cpf)
            existing = await asaas_service.get_customer_by_email(user.email)
            if existing and existing["id"] == user.asaas_customer_id:
                return user.asaas_customer_id
        except Exception:
            pass
        user.asaas_customer_id = None
    
    customer = await asaas_service.get_customer_by_email(user.email)
    if not customer:
        customer = await asaas_service.create_customer(user.email, cpf=cpf)
    elif cpf:
        await asaas_service.update_customer(customer["id"], cpf)
    
    user.asaas_customer_id = customer["id"]
    await db.commit()
    return customer["id"]

@router.post("/create-pro-subscription")
async def create_pro_subscription(
    request: CreateProSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    plan_type = request.plan_type or "basic"
    if plan_type not in ["basic", "pro", "premium"]:
        raise HTTPException(status_code=400, detail="Tipo de plano invalido")
    
    if current_user.plan == plan_type:
        raise HTTPException(status_code=400, detail=f"Voce ja e assinante {plan_type.upper()}")
    
    if request.billing_type not in ["PIX", "CREDIT_CARD"]:
        raise HTTPException(status_code=400, detail="Tipo de pagamento invalido")
    
    plan_config = {
        "basic": (settings.BASIC_MONTHLY_PRICE / 100, "Basico"),
        "pro": (settings.PRO_MONTHLY_PRICE / 100, "PRO"),
        "premium": (settings.PREMIUM_MONTHLY_PRICE / 100, "Premium"),
    }
    price, plan_label = plan_config[plan_type]
    
    try:
        cpf = request.holder_cpf if request.holder_cpf else None
        customer_id = await get_or_create_customer(current_user, db, cpf=cpf)
        
        if cpf:
            await asaas_service.update_customer(customer_id, cpf)
        
        external_reference = json.dumps({
            "user_id": current_user.id,
            "type": "pro_subscription",
            "plan_type": plan_type
        })
        
        if request.billing_type == "PIX":
            payment = await asaas_service.create_pix_payment(
                customer_id=customer_id,
                value=price,
                description=f"PicNutra {plan_label} - Primeira mensalidade",
                external_reference=external_reference
            )
            
            payment_id = payment.get("id")
            pix_data = await asaas_service.get_pix_qr_code(payment_id)
            
            db_payment = Payment(
                user_id=current_user.id,
                asaas_payment_id=payment_id,
                payment_type="pro_subscription",
                billing_type="PIX",
                amount=price,
                status="pending",
                pix_code=pix_data.get("payload", "")[:500] if pix_data.get("payload") else None
            )
            db.add(db_payment)
            await db.commit()
            
            return {
                "status": "pending",
                "payment_id": payment_id,
                "pix_code": pix_data.get("payload", ""),
                "pix_qr_code_base64": pix_data.get("encodedImage", ""),
                "message": f"Pague o PIX para ativar sua assinatura {plan_label}"
            }
        
        if request.billing_type == "CREDIT_CARD":
            card_data = {
                "holderName": request.card_holder_name,
                "number": request.card_number,
                "expiryMonth": request.expiry_month,
                "expiryYear": request.expiry_year,
                "ccv": request.cvv
            }
            card_holder_info = {
                "name": request.card_holder_name,
                "email": current_user.email,
                "cpfCnpj": request.holder_cpf,
                "postalCode": request.postal_code,
                "addressNumber": request.address_number,
                "phone": request.holder_phone
            }
            
            subscription = await asaas_service.create_subscription(
                customer_id=customer_id,
                value=price,
                billing_type="CREDIT_CARD",
                description=f"PicNutra {plan_label} - Assinatura Mensal",
                external_reference=external_reference,
                card_data=card_data,
                card_holder_info=card_holder_info,
                next_due_days=1
            )
            
            db_payment = Payment(
                user_id=current_user.id,
                asaas_payment_id=subscription.get("id"),
                asaas_subscription_id=subscription.get("id"),
                payment_type="pro_subscription",
                billing_type="CREDIT_CARD",
                amount=price,
                status="confirmed",
                description=f"Assinatura {plan_label} (Cartao)",
                paid_at=datetime.utcnow()
            )
            db.add(db_payment)
            
            current_user.asaas_subscription_id = subscription["id"]
            current_user.plan = plan_type
            current_user.simple_analyses_used = 0
            current_user.full_analyses_used = 0
            current_user.analyses_reset_at = datetime.utcnow()
            current_user.pro_started_at = datetime.utcnow()
            await db.commit()
            send_upgraded_to_pro_email(current_user.email, current_user.id)
            await flush_email_logs(db)
            return {"status": "active", "message": f"Assinatura {plan_label} ativada com sucesso!"}
        
        return {"status": "error", "message": "Tipo de pagamento nao suportado"}
    
    except AsaasError as e:
        await log_billing_error(
            db=db,
            error_type="pro_subscription",
            error_message=e.message,
            user_id=current_user.id,
            extra_data=e.to_dict()
        )
        raise HTTPException(status_code=400, detail=f"Erro ao criar assinatura: {e.message}")
    except Exception as e:
        await log_billing_error(
            db=db,
            error_type="pro_subscription",
            error_message=str(e),
            user_id=current_user.id,
            extra_data={"billing_type": request.billing_type, "error_type": type(e).__name__}
        )
        raise HTTPException(status_code=400, detail=f"Erro ao criar assinatura: {str(e)}")

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.asaas_subscription_id:
        raise HTTPException(status_code=400, detail="Voce nao possui assinatura ativa")
    
    try:
        await asaas_service.cancel_subscription(current_user.asaas_subscription_id)
        user_email = current_user.email
        current_user.asaas_subscription_id = None
        current_user.plan = "free"
        await db.commit()
        
        send_subscription_cancelled_email(user_email, current_user.id)
        await flush_email_logs(db)
        
        return {"status": "cancelled", "message": "Assinatura cancelada com sucesso"}
    
    except AsaasError as e:
        await log_billing_error(
            db=db,
            error_type="cancel_subscription",
            error_message=e.message,
            user_id=current_user.id,
            extra_data=e.to_dict()
        )
        raise HTTPException(status_code=400, detail=f"Erro ao cancelar assinatura: {e.message}")
    except Exception as e:
        await log_billing_error(
            db=db,
            error_type="cancel_subscription",
            error_message=str(e),
            user_id=current_user.id,
            extra_data={"subscription_id": current_user.asaas_subscription_id, "error_type": type(e).__name__}
        )
        raise HTTPException(status_code=400, detail=f"Erro ao cancelar assinatura: {str(e)}")

@router.get("/payment-status/{payment_id}", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        payment = await asaas_service.get_payment(payment_id)
        status = payment.get("status", "PENDING")
        confirmed = status in ["CONFIRMED", "RECEIVED"]
        
        return PaymentStatusResponse(status=status, confirmed=confirmed)
    except AsaasError as e:
        raise HTTPException(status_code=400, detail=f"Erro ao verificar status: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao verificar status: {str(e)}")

async def calculate_partner_commission(db: AsyncSession, user: User, db_payment, payment_amount: float):
    """Calculate commission for referrer: 30% for PJ partners, 10% for PF users"""
    try:
        if not user.referred_by:
            return
        
        partner_result = await db.execute(select(User).where(User.id == user.referred_by))
        partner = partner_result.scalar_one_or_none()
        
        if not partner:
            return
        
        existing = await db.execute(
            select(Commission).where(
                Commission.partner_id == partner.id,
                Commission.referred_user_id == user.id,
                Commission.payment_id == db_payment.id
            )
        )
        if existing.scalar_one_or_none():
            return
        
        commission_rate = partner.commission_rate or 0.30
        commission_amount = round(payment_amount * commission_rate, 2)
        
        commission = Commission(
            partner_id=partner.id,
            referred_user_id=user.id,
            payment_id=db_payment.id,
            payment_amount=payment_amount,
            commission_amount=commission_amount,
            commission_rate=commission_rate,
            status="pending"
        )
        db.add(commission)
        partner.commission_balance = (partner.commission_balance or 0) + commission_amount
        await db.commit()
        
        logger.info(f"[commission] Partner {partner.id} earned R${commission_amount:.2f} from user {user.id} payment of R${payment_amount:.2f}")
    except Exception as e:
        logger.error(f"[commission] Error calculating commission: {e}")

@router.post("/webhook")
async def asaas_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    event_type = body.get("event")
    payment = body.get("payment", {})
    subscription = body.get("subscription", {})
    
    logger.info(f"[webhook] Received event: {event_type}")
    
    if event_type in ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]:
        external_reference = payment.get("externalReference")
        asaas_payment_id = payment.get("id")
        
        db_payment_result = await db.execute(
            select(Payment).where(Payment.asaas_payment_id == asaas_payment_id)
        )
        db_payment = db_payment_result.scalar_one_or_none()
        if db_payment:
            db_payment.status = "confirmed"
            db_payment.paid_at = datetime.utcnow()
            await db.commit()
        
        if external_reference:
            try:
                ref_data = json.loads(external_reference)
                user_id = ref_data.get("user_id")
                payment_type = ref_data.get("type")
                
                logger.info(f"[webhook] Processing payment for user_id={user_id}, type={payment_type}")
                
                if user_id:
                    result = await db.execute(select(User).where(User.id == int(user_id)))
                    user = result.scalar_one_or_none()
                    
                    if user and payment_type == "pro_subscription":
                            sub_plan_type = ref_data.get("plan_type", "basic")
                            if user.plan != sub_plan_type:
                                user.plan = sub_plan_type
                                user.simple_analyses_used = 0
                                user.full_analyses_used = 0
                                user.analyses_reset_at = datetime.utcnow()
                                user.pro_started_at = datetime.utcnow()
                                
                                if not user.asaas_subscription_id and user.asaas_customer_id:
                                    try:
                                        plan_prices = {
                                            "basic": (settings.BASIC_MONTHLY_PRICE / 100, "Basico"),
                                            "pro": (settings.PRO_MONTHLY_PRICE / 100, "PRO"),
                                            "premium": (settings.PREMIUM_MONTHLY_PRICE / 100, "Premium"),
                                        }
                                        sub_price, sub_label = plan_prices.get(sub_plan_type, (settings.BASIC_MONTHLY_PRICE / 100, "Basico"))
                                        
                                        subscription = await asaas_service.create_subscription(
                                            customer_id=user.asaas_customer_id,
                                            value=sub_price,
                                            billing_type="PIX",
                                            description=f"PicNutra {sub_label} - Assinatura Mensal",
                                            external_reference=json.dumps({
                                                "user_id": user.id,
                                                "type": "pro_subscription",
                                                "plan_type": sub_plan_type
                                            })
                                        )
                                        user.asaas_subscription_id = subscription.get("id")
                                        logger.info(f"[webhook] Created recurring subscription for user_id={user_id}")
                                    except Exception as sub_error:
                                        logger.error(f"[webhook] Failed to create subscription: {sub_error}")
                                
                                await db.commit()
                                logger.info(f"[webhook] {sub_plan_type} activated for user_id={user_id}")
                                send_upgraded_to_pro_email(user.email, user.id)
                                await flush_email_logs(db)
                                
                                if db_payment:
                                    payment_value = payment.get("value", 0)
                                    if payment_value and float(payment_value) > 0:
                                        await calculate_partner_commission(db, user, db_payment, float(payment_value))
                                
                                return {"status": "plan_activated", "plan": sub_plan_type}
                            else:
                                user.simple_analyses_used = 0
                                user.full_analyses_used = 0
                                user.analyses_reset_at = datetime.utcnow()
                                await db.commit()
                                logger.info(f"[webhook] {sub_plan_type} renewed for user_id={user_id}")
                                send_subscription_renewed_email(user.email, 0, user.id)
                                await flush_email_logs(db)
                                
                                if db_payment:
                                    payment_value = payment.get("value", 0)
                                    if payment_value and float(payment_value) > 0:
                                        await calculate_partner_commission(db, user, db_payment, float(payment_value))
                                
                                return {"status": "plan_renewed"}
                            
            except json.JSONDecodeError:
                logger.error(f"[webhook] Failed to parse externalReference: {external_reference}")
    
    elif event_type == "PAYMENT_OVERDUE":
        external_reference = payment.get("externalReference")
        if external_reference:
            try:
                ref_data = json.loads(external_reference)
                user_id = ref_data.get("user_id")
                payment_type = ref_data.get("type")
                
                if user_id and payment_type == "pro_subscription":
                    result = await db.execute(select(User).where(User.id == int(user_id)))
                    user = result.scalar_one_or_none()
                    if user and user.plan in ["basic", "pro", "premium"]:
                        logger.warning(f"[webhook] Payment overdue for {user.plan} user_id={user_id}")
            except json.JSONDecodeError:
                pass
    
    elif event_type in ["SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVE", "SUBSCRIPTION_INACTIVATED"]:
        subscription_id = subscription.get("id") or body.get("id")
        if subscription_id:
            result = await db.execute(
                select(User).where(User.asaas_subscription_id == subscription_id)
            )
            user = result.scalar_one_or_none()
            if user:
                user.plan = "free"
                user.asaas_subscription_id = None
                await db.commit()
                logger.info(f"[webhook] Subscription cancelled for user_id={user.id}")
                return {"status": "subscription_cancelled"}
    
    return {"status": "ok"}

@router.get("/debug-pix/{cpf}")
async def debug_pix_payment(
    cpf: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import traceback
    result = {
        "step": "start",
        "user_id": current_user.id,
        "user_email": current_user.email,
        "cpf_received": cpf,
        "cpf_cleaned": cpf.replace(".", "").replace("-", ""),
        "asaas_customer_id": current_user.asaas_customer_id,
    }
    
    try:
        result["step"] = "get_or_create_customer"
        clean_cpf = cpf.replace(".", "").replace("-", "")
        customer_id = await get_or_create_customer(current_user, db, cpf=clean_cpf)
        result["customer_id"] = customer_id
        
        result["step"] = "create_payment"
        external_reference = json.dumps({
            "user_id": current_user.id,
            "type": "debug_pix"
        })
        
        payment = await asaas_service.create_pix_payment(
            customer_id=customer_id,
            value=9.90,
            description="Teste PIX",
            external_reference=external_reference
        )
        result["payment"] = payment
        result["payment_id"] = payment.get("id")
        
        result["step"] = "get_qr_code"
        pix_data = await asaas_service.get_pix_qr_code(payment["id"])
        result["pix_payload"] = pix_data.get("payload", "")[:50] + "..." if pix_data.get("payload") else None
        result["has_qr_code"] = bool(pix_data.get("encodedImage"))
        
        result["step"] = "success"
        result["success"] = True
        
    except Exception as e:
        result["error"] = str(e)
        result["error_type"] = type(e).__name__
        result["traceback"] = traceback.format_exc()
        result["success"] = False
    
    return result

@router.post("/test-confirm-payment/{payment_id}")
async def test_confirm_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import logging
    logger = logging.getLogger(__name__)
    
    result = await db.execute(
        select(Payment).where(Payment.asaas_payment_id == payment_id)
    )
    db_payment = result.scalar_one_or_none()
    
    if not db_payment:
        raise HTTPException(status_code=404, detail="Pagamento nao encontrado")
    
    if db_payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Pagamento nao pertence a este usuario")
    
    if db_payment.status == "confirmed":
        raise HTTPException(status_code=400, detail="Pagamento ja confirmado")
    
    db_payment.status = "confirmed"
    db_payment.paid_at = datetime.utcnow()
    
    if db_payment.payment_type == "pro_subscription":
        plan_type = "basic"
        if db_payment.amount and db_payment.amount >= 49:
            plan_type = "premium"
        elif db_payment.amount and db_payment.amount >= 19:
            plan_type = "pro"
        
        current_user.plan = plan_type
        current_user.simple_analyses_used = 0
        current_user.full_analyses_used = 0
        current_user.analyses_reset_at = datetime.utcnow()
        current_user.pro_started_at = datetime.utcnow()
        
        if not current_user.asaas_subscription_id and current_user.asaas_customer_id:
            try:
                plan_prices = {
                    "basic": (settings.BASIC_MONTHLY_PRICE / 100, "Basico"),
                    "pro": (settings.PRO_MONTHLY_PRICE / 100, "PRO"),
                    "premium": (settings.PREMIUM_MONTHLY_PRICE / 100, "Premium"),
                }
                sub_price, sub_label = plan_prices.get(plan_type, (settings.BASIC_MONTHLY_PRICE / 100, "Basico"))
                subscription = await asaas_service.create_subscription(
                    customer_id=current_user.asaas_customer_id,
                    value=sub_price,
                    billing_type="PIX",
                    description=f"PicNutra {sub_label} - Assinatura Mensal",
                    external_reference=json.dumps({
                        "user_id": current_user.id,
                        "type": "pro_subscription",
                        "plan_type": plan_type
                    })
                )
                current_user.asaas_subscription_id = subscription.get("id")
                logger.info(f"[test] Created subscription {subscription.get('id')} for user {current_user.id}")
            except Exception as e:
                logger.error(f"[test] Failed to create subscription: {e}")
        
        await db.commit()
        send_upgraded_to_pro_email(current_user.email)
        await flush_email_logs(db)
        
        return {
            "status": "success",
            "message": f"Pagamento confirmado! Plano {plan_type} ativado!",
            "plan": plan_type,
            "subscription_id": current_user.asaas_subscription_id
        }
    
    await db.commit()
    await flush_email_logs(db)
    return {"status": "success", "message": "Pagamento confirmado"}

@router.get("/diagnose")
async def diagnose_asaas():
    import httpx
    result = {
        "asaas_base_url": settings.ASAAS_BASE_URL,
        "api_key_configured": bool(settings.ASAAS_API_KEY),
        "api_key_prefix": settings.ASAAS_API_KEY[:20] + "..." if settings.ASAAS_API_KEY else None,
        "tests": {}
    }
    
    headers = {
        "access_token": settings.ASAAS_API_KEY,
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{settings.ASAAS_BASE_URL}/customers?limit=1",
                headers=headers
            )
            result["tests"]["list_customers"] = {
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "response": response.text[:500] if response.status_code != 200 else "OK"
            }
        except Exception as e:
            result["tests"]["list_customers"] = {"error": str(e)}
        
        try:
            response = await client.get(
                f"{settings.ASAAS_BASE_URL}/pix/addressKeys",
                headers=headers
            )
            result["tests"]["pix_keys"] = {
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "response": response.text[:500]
            }
        except Exception as e:
            result["tests"]["pix_keys"] = {"error": str(e)}
        
        try:
            response = await client.get(
                f"{settings.ASAAS_BASE_URL}/myAccount/status",
                headers=headers
            )
            result["tests"]["account_status"] = {
                "status_code": response.status_code,
                "response": response.text[:500]
            }
        except Exception as e:
            result["tests"]["account_status"] = {"error": str(e)}
    
    return result
