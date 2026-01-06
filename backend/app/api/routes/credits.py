from fastapi import APIRouter, Depends
from app.schemas.schemas import CreditBalanceResponse
from app.core.security import get_current_user
from app.models.models import User

router = APIRouter(prefix="/credits", tags=["credits"])

@router.get("/balance", response_model=CreditBalanceResponse)
async def get_credit_balance(current_user: User = Depends(get_current_user)):
    return CreditBalanceResponse(
        credit_balance=current_user.credit_balance,
        pro_analyses_remaining=current_user.pro_analyses_remaining
    )
