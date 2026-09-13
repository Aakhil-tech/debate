
import uuid
from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.db import repo
from app.services import ai
from app.services.credits import gate
from app.models.schemas import FumbleRequest, FumbleResult
from app.config import settings

router = APIRouter()


@router.post(
    "/analyze",
    response_model=FumbleResult,
    summary="Analyze a draft message for fumble risk",
)
async def analyze_draft(
    body: FumbleRequest,
    current_user: dict = Depends(get_current_user),
):
    new_balance = await gate(current_user["id"], settings.CREDITS_FUMBLE_ANALYSIS)

    result = await ai.analyze_fumble(draft=body.draft, context=body.context)

    analysis_id = str(uuid.uuid4())

    await repo().save_fumble_analysis(
        analysis_id=analysis_id,
        user_id=current_user["id"],
        threat_level=result.get("threatLevel", 5),
        fumble_pct=result.get("fumblePct", 100),
        survival_chance=result.get("survivalChance", 0),
        draft_length=len(body.draft),
        draft_text=None if settings.ZERO_LOG_RETENTION else body.draft,
    )

    return FumbleResult(
        analysis_id=analysis_id,
        credits_remaining=new_balance,
        threatLevel=result.get("threatLevel", 5),
        threatLabel=result.get("threatLabel", "CATASTROPHIC FUMBLE"),
        fumblePct=result.get("fumblePct", 100),
        survivalChance=result.get("survivalChance", 0),
        detectedTag=result.get("detectedTag", "Detected: High Vulnerability"),
        detectedIssues=result.get("detectedIssues", []),
        frameImpact=result.get("frameImpact", ""),
        whyBad=result.get("whyBad", ""),
        safeCountermeasures=result.get("safeCountermeasures", []),
        tacticalAdvice=result.get("tacticalAdvice", ""),
        tacticalPrinciples=result.get("tacticalPrinciples", []),
    )
