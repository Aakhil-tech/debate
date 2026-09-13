from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    handle: str = Field(min_length=2, max_length=30)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserProfile"

class UserProfile(BaseModel):
    id: str
    email: str
    handle: str
    credits: int
    level: int
    clean_wins: int
    fumble_flags: int
    meltdowns: int


class CreditsBalance(BaseModel):
    credits: int
    level: int

class AddCreditsRequest(BaseModel):
    amount: int = Field(gt=0)
    reason: str = "manual_topup"


class ReceiptsTextRequest(BaseModel):
    text_content: str = Field(min_length=5)

class ForensicNode(BaseModel):
    type: str
    text: str
    time: Optional[str] = None
    latency: Optional[str] = None
    tag: Optional[str] = None
    buffer: Optional[str] = None
    alert: Optional[str] = None
    analysis: Optional[str] = None

class SubtextMatrix(BaseModel):
    stated: str
    actual: str
    intent: str

class ForensicAnalysisResult(BaseModel):
    case_id: str
    title: str
    nodeCount: int
    nodes: List[ForensicNode]
    subtextScore: int
    frameLossPct: int
    egoDeficitPct: int
    tacticalMove: str
    subtextMatrix: Optional[SubtextMatrix] = None
    tacticalRetorts: List[str] = []
    forensicSummary: str
    credits_remaining: int
    created_at: Optional[datetime] = None

class CaseSummary(BaseModel):
    case_id: str
    title: str
    created_at: datetime
    subtextScore: int
    frameLossPct: int


class FumbleRequest(BaseModel):
    draft: str = Field(min_length=1)
    context: Optional[str] = None

class FumbleResult(BaseModel):
    analysis_id: str
    threatLevel: int
    threatLabel: str
    fumblePct: int
    survivalChance: int
    detectedTag: str
    detectedIssues: List[str] = []
    frameImpact: str
    whyBad: str
    safeCountermeasures: List[str]
    tacticalAdvice: str
    tacticalPrinciples: List[str] = []
    credits_remaining: int


class StartSparringRequest(BaseModel):
    topic: str = Field(min_length=3)
    persona: str = "chaos"
    aggressiveness: int = Field(default=7, ge=1, le=10)

class SparringMessage(BaseModel):
    message: str = Field(min_length=1)

class SparringTurnResult(BaseModel):
    botReply: str
    fallacyUsed: Optional[str] = None
    frameShift: int
    coachWhisper: str
    roundStatus: str
    userFramePct: int
    botFramePct: int
    credits_remaining: int

class SparringSession(BaseModel):
    session_id: str
    topic: str
    persona: str
    aggressiveness: int
    userFramePct: int
    botFramePct: int
    round: int
    status: str
    messages: List[dict]
    created_at: datetime

class VerdictResult(BaseModel):
    winner: str
    finalFrameUser: int
    finalFrameAI: int
    userMvpMove: str
    userBiggestFumble: str
    verdictSummary: str
    lessons: List[str]
    rematchRecommended: bool
    session_id: str


class WarRoomStats(BaseModel):
    handle: str
    level: int
    clean_wins: int
    fumble_flags: int
    meltdowns: int
    credits: int
    recent_cases: List[CaseSummary] = []
    active_target_audit: Optional[dict] = None
    recommended_move: str

class ActiveCase(BaseModel):
    case_id: Optional[str] = None
    title: Optional[str] = None
    target_message: Optional[str] = None
    subtext_score: Optional[int] = None
    frame_loss_pct: Optional[int] = None
    recommended_reply: Optional[str] = None
    latency_note: Optional[str] = None
