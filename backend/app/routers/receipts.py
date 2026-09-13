
import uuid
import base64
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException

from app.auth import get_current_user
from app.db import repo
from app.services import ai
from app.services.credits import gate
from app.models.schemas import (
    ReceiptsTextRequest,
    ForensicAnalysisResult,
    CaseSummary,
)
from app.config import settings

router = APIRouter()


@router.post(
    "/upload",
    summary="Upload screenshot(s) for forensic analysis",
    response_model=ForensicAnalysisResult,
)
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.MAX_UPLOAD_MB}MB)")

    new_balance = await gate(current_user["id"], settings.CREDITS_FORENSIC_ANALYSIS)

    case_id = str(uuid.uuid4())
    storage_path = await repo().save_image(
        current_user["id"], case_id, file.filename, content, file.content_type
    )

    image_b64 = base64.b64encode(content).decode()
    result = await ai.analyze_receipts(text_content="", image_base64=image_b64)

    await repo().save_case(current_user["id"], case_id, result, storage_path)

    return ForensicAnalysisResult(
        case_id=case_id,
        credits_remaining=new_balance,
        created_at=datetime.now(timezone.utc),
        **result,
    )


@router.post(
    "/analyze",
    summary="Forensic analysis from pasted text",
    response_model=ForensicAnalysisResult,
)
async def analyze_text(
    body: ReceiptsTextRequest,
    current_user: dict = Depends(get_current_user),
):
    new_balance = await gate(current_user["id"], settings.CREDITS_FORENSIC_ANALYSIS)

    result = await ai.analyze_receipts(text_content=body.text_content)

    case_id = str(uuid.uuid4())
    await repo().save_case(current_user["id"], case_id, result, None)

    return ForensicAnalysisResult(
        case_id=case_id,
        credits_remaining=new_balance,
        created_at=datetime.now(timezone.utc),
        **result,
    )


@router.get(
    "/",
    summary="List past forensic cases",
    response_model=list[CaseSummary],
)
async def list_cases(
    current_user: dict = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0,
):
    rows = await repo().list_cases(current_user["id"], limit, offset)
    return [
        CaseSummary(
            case_id=r["id"],
            title=r["title"],
            created_at=r["created_at"],
            subtextScore=r["subtext_score"],
            frameLossPct=r["frame_loss_pct"],
        )
        for r in rows
    ]


@router.get(
    "/{case_id}",
    summary="Get a specific forensic case",
    response_model=ForensicAnalysisResult,
)
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
):
    row = await repo().get_case(case_id, current_user["id"])
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")

    analysis = row.get("analysis_json") or {}

    return ForensicAnalysisResult(
        case_id=row["id"],
        title=row["title"],
        nodeCount=row["node_count"],
        nodes=analysis.get("nodes", []),
        subtextScore=row["subtext_score"],
        frameLossPct=row["frame_loss_pct"],
        egoDeficitPct=row.get("ego_deficit_pct", 0),
        tacticalMove=row["tactical_move"],
        subtextMatrix=analysis.get("subtextMatrix"),
        tacticalRetorts=analysis.get("tacticalRetorts", []),
        forensicSummary=row["forensic_summary"],
        credits_remaining=current_user["credits"],
        created_at=row["created_at"],
    )
