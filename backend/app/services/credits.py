
from fastapi import HTTPException

from app.db import repo


async def gate(user_id: str, cost: int) -> int:
    try:
        return await repo().deduct_credits(user_id, cost)
    except ValueError as e:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "insufficient_credits",
                "message": str(e),
                "cost": cost,
                "upgrade_url": "/credits/purchase",
            },
        )


async def get_balance(user_id: str) -> int:
    user = await repo().get_user(user_id)
    return user["credits"] if user else 0
