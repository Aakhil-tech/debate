from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.db import repo
from app.models.schemas import CreditsBalance, AddCreditsRequest
from app.config import settings

router = APIRouter()


@router.get("/balance", response_model=CreditsBalance, summary="Get credit balance")
async def get_balance(current_user: dict = Depends(get_current_user)):
    return CreditsBalance(
        credits=current_user["credits"],
        level=current_user["level"],
    )


@router.post("/add", response_model=CreditsBalance, summary="Add credits (admin / webhook)")
async def add_credits(
    body: AddCreditsRequest,
    current_user: dict = Depends(get_current_user),
):
    new_balance = await repo().add_credits(current_user["id"], body.amount)
    user = await repo().get_user(current_user["id"])
    return CreditsBalance(credits=new_balance, level=user["level"])


@router.get("/costs", summary="Credit costs per operation")
async def get_costs():
    return {
        "forensic_analysis": settings.CREDITS_FORENSIC_ANALYSIS,
        "fumble_analysis": settings.CREDITS_FUMBLE_ANALYSIS,
        "sparring_turn": settings.CREDITS_SPARRING_TURN,
        "new_user_bonus": settings.CREDITS_NEW_USER_BONUS,
    }
