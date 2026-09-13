
from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.config import settings
from app.db import repo
from app.models.schemas import WarRoomStats, ActiveCase, CaseSummary

router = APIRouter()

RECOMMENDED_MOVES = [
    '"No stress, get through work! Catch you later this week ✌️"',
    '"Sounds like a plan. Ping me when you resurface 🫡"',
    '"All good! Have fun with the grind ✌️"',
    '"Got it. Let\'s touch base next week when things settle down."',
]


@router.get("/stats", response_model=WarRoomStats, summary="Get War Room dashboard stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    rows = await repo().get_recent_cases(current_user["id"], limit=5)
    recent_cases = [
        CaseSummary(
            case_id=r["id"],
            title=r["title"],
            created_at=r["created_at"],
            subtextScore=r["subtext_score"],
            frameLossPct=r["frame_loss_pct"],
        )
        for r in rows
    ]

    active_audit = None
    if recent_cases:
        top = max(recent_cases, key=lambda c: c.subtextScore)
        active_audit = {
            "case_id": top.case_id,
            "title": top.title,
            "subtext_score": top.subtextScore,
            "frame_loss_pct": top.frameLossPct,
        }

    level = max(1, current_user["clean_wins"] // 5 + 1)

    move_idx = current_user["clean_wins"] % len(RECOMMENDED_MOVES)

    return WarRoomStats(
        handle=current_user["handle"],
        level=level,
        clean_wins=current_user["clean_wins"],
        fumble_flags=current_user["fumble_flags"],
        meltdowns=current_user["meltdowns"],
        credits=current_user["credits"],
        credits_unlimited=settings.CREDITS_UNLIMITED,
        recent_cases=recent_cases,
        active_target_audit=active_audit,
        recommended_move=RECOMMENDED_MOVES[move_idx],
    )


@router.get("/active-case", response_model=ActiveCase, summary="Get most recent open case")
async def get_active_case(current_user: dict = Depends(get_current_user)):
    row = await repo().get_most_recent_case(current_user["id"])
    if not row:
        return ActiveCase()

    analysis = row.get("analysis_json") or {}

    target_text = None
    for node in analysis.get("nodes", []):
        if node.get("type") == "target":
            target_text = node.get("text")
            break

    return ActiveCase(
        case_id=row["id"],
        title=row["title"],
        target_message=target_text,
        subtext_score=row["subtext_score"],
        frame_loss_pct=row["frame_loss_pct"],
        recommended_reply=row["tactical_move"],
        latency_note=analysis.get("nodes", [{}])[-1].get("latency"),
    )
