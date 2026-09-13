
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.db import repo
from app.services import ai
from app.services.credits import gate
from app.models.schemas import (
    StartSparringRequest,
    SparringMessage,
    SparringTurnResult,
    SparringSession,
    VerdictResult,
)
from app.config import settings

router = APIRouter()

BOT_CONFIGS = {
    "chaos": {
        "name": "Chaos Engine v3.0",
        "default_topic": '"Who decided on sushi vs tacos last Friday?"',
    },
    "ex": {
        "name": "Passive-Aggressive Ex",
        "default_topic": '"Are you bringing your new friends to the party?"',
    },
    "boss": {
        "name": "Corporate Dry Boss",
        "default_topic": '"Where is the Q3 breakdown deck?"',
    },
    "ghoster": {
        "name": "Selective Ghoster",
        "default_topic": '"So are we still hanging out tomorrow?"',
    },
}


async def _get_session(session_id: str, user_id: str) -> dict:
    try:
        return await repo().get_sparring_session(session_id, user_id)
    except LookupError:
        raise HTTPException(status_code=404, detail="Session not found")


@router.post("/start", response_model=SparringSession, summary="Start a sparring session")
async def start_session(
    body: StartSparringRequest,
    current_user: dict = Depends(get_current_user),
):
    cfg = BOT_CONFIGS.get(body.persona, BOT_CONFIGS["chaos"])
    session_id = str(uuid.uuid4())

    session = await repo().create_sparring_session(
        session_id=session_id,
        user_id=current_user["id"],
        topic=body.topic,
        persona=body.persona,
        persona_name=cfg["name"],
        aggressiveness=body.aggressiveness,
        user_frame_pct=68,
        bot_frame_pct=32,
    )

    return SparringSession(
        session_id=session["id"],
        topic=session["topic"],
        persona=session["persona"],
        aggressiveness=session["aggressiveness"],
        userFramePct=session["user_frame_pct"],
        botFramePct=session["bot_frame_pct"],
        round=session["round"],
        status=session["status"],
        messages=session.get("messages", []),
        created_at=session["created_at"],
    )


@router.post(
    "/{session_id}/message",
    response_model=SparringTurnResult,
    summary="Send a user message in a sparring session",
)
async def send_message(
    session_id: str,
    body: SparringMessage,
    current_user: dict = Depends(get_current_user),
):
    session = await _get_session(session_id, current_user["id"])

    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    new_balance = await gate(current_user["id"], settings.CREDITS_SPARRING_TURN)

    cfg = BOT_CONFIGS.get(session["persona"], BOT_CONFIGS["chaos"])
    messages = session.get("messages", [])

    result = await ai.sparring_turn(
        persona=cfg["name"],
        topic=session["topic"],
        aggressiveness=session["aggressiveness"],
        chat_history=messages,
        user_message=body.message,
    )

    user_frame = max(10, min(95, session["user_frame_pct"] + result.get("frameShift", 0)))
    bot_frame = 100 - user_frame

    user_msg = {"sender": "user", "text": body.message, "time": datetime.now(timezone.utc).isoformat()}
    bot_msg = {"sender": "bot", "text": result.get("botReply", ""), "time": datetime.now(timezone.utc).isoformat()}
    new_messages = messages + [user_msg, bot_msg]

    new_round = session["round"] + 1
    new_status = "knockout" if result.get("roundStatus") == "knockout" else "active"

    await repo().update_sparring_session(
        session_id,
        messages=new_messages if not settings.ZERO_LOG_RETENTION else [],
        user_frame_pct=user_frame,
        bot_frame_pct=bot_frame,
        round=new_round,
        status=new_status,
    )

    return SparringTurnResult(
        botReply=result.get("botReply", ""),
        fallacyUsed=result.get("fallacyUsed"),
        frameShift=result.get("frameShift", 0),
        coachWhisper=result.get("coachWhisper", ""),
        roundStatus=new_status,
        userFramePct=user_frame,
        botFramePct=bot_frame,
        credits_remaining=new_balance,
    )


@router.get(
    "/{session_id}",
    response_model=SparringSession,
    summary="Get sparring session state",
)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    session = await _get_session(session_id, current_user["id"])
    return SparringSession(
        session_id=session["id"],
        topic=session["topic"],
        persona=session["persona"],
        aggressiveness=session["aggressiveness"],
        userFramePct=session["user_frame_pct"],
        botFramePct=session["bot_frame_pct"],
        round=session["round"],
        status=session["status"],
        messages=session.get("messages", []),
        created_at=session["created_at"],
    )


@router.post(
    "/{session_id}/verdict",
    response_model=VerdictResult,
    summary="Call the Referee — end the session with a verdict",
)
async def get_verdict(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    session = await _get_session(session_id, current_user["id"])
    messages = session.get("messages", [])

    if len(messages) < 2:
        raise HTTPException(status_code=400, detail="Not enough exchanges for a verdict")

    result = await ai.sparring_verdict(
        topic=session["topic"],
        chat_history=messages,
        final_frame_user=session["user_frame_pct"],
        final_frame_ai=session["bot_frame_pct"],
    )

    await repo().update_sparring_session(
        session_id, status="verdict", verdict_json=result
    )

    if result.get("winner") == "user":
        await repo().increment_stat(current_user["id"], "clean_wins")
    elif result.get("winner") == "ai":
        await repo().increment_stat(current_user["id"], "meltdowns")

    return VerdictResult(
        session_id=session_id,
        winner=result.get("winner", "draw"),
        finalFrameUser=result.get("finalFrameUser", session["user_frame_pct"]),
        finalFrameAI=result.get("finalFrameAI", session["bot_frame_pct"]),
        userMvpMove=result.get("userMvpMove", ""),
        userBiggestFumble=result.get("userBiggestFumble", ""),
        verdictSummary=result.get("verdictSummary", ""),
        lessons=result.get("lessons", []),
        rematchRecommended=result.get("rematchRecommended", True),
    )
