/**
 * Debate & Win 3.0 — API bridge to the real backend (FastAPI + Groq + Supabase/Postgres).
 * Auth is invisible: a guest session is created on first load and reused via localStorage.
 */

const BASE_URL = "";
const TOKEN_KEY = "dw_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

let guestAuthPromise: Promise<string> | null = null;

async function ensureToken(): Promise<string> {
  const existing = getToken();
  if (existing) return existing;
  if (!guestAuthPromise) {
    guestAuthPromise = fetch(`${BASE_URL}/auth/guest`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        setToken(data.access_token);
        return data.access_token as string;
      });
  }
  return guestAuthPromise;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await ensureToken();
  const isFormData = options.body instanceof FormData;
  let res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    setToken(null);
    guestAuthPromise = null;
    const freshToken = await ensureToken();
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${freshToken}`,
        ...options.headers,
      },
    });
  }
  return res;
}

async function postJSON<T>(endpoint: string, body: any): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      errorDetail =
        typeof json.detail === "string" ? json.detail : json.detail?.message || JSON.stringify(json);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  const mimeType = match?.[1] || "image/png";
  const base64 = match ? match[2] : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mimeType }), mimeType };
}

// ---------------------------------------------------------------------------
// 1. Receipts & Forensic Ingestion
// ---------------------------------------------------------------------------
export interface OcrResult {
  rawText: string;
  detectedApp: string;
  confidence: number;
  bubblesDetected: number;
  participants: string[];
  bubbles: Array<{
    sender: "you" | "them";
    text: string;
    timestamp?: string;
    status?: string;
  }>;
}

export interface ForensicReceiptResult {
  case_id: string;
  title: string;
  node_count: number;
  subtext_score: number;
  frame_loss_pct: number;
  ego_deficit_pct: number;
  tactical_move: string;
  forensic_summary: string;
  raw_ocr_text?: string;
  detected_app?: string;
  ocr_confidence?: number;
  bubbles_detected?: number;
  nodes: Array<{
    id: string;
    sender: "you" | "them";
    text: string;
    timestamp: string;
    latency: string;
    badge?: string;
    errorCallout?: string;
    subtextBadge?: string;
    readReceipt?: boolean;
  }>;
}

interface BackendNode {
  type: "outgoing" | "incoming" | "unforced_error" | "target";
  text: string;
  time?: string;
  latency?: string;
  tag?: string;
  buffer?: string;
  alert?: string;
  analysis?: string;
}

interface BackendForensicResult {
  case_id: string;
  title: string;
  nodeCount: number;
  nodes: BackendNode[];
  subtextScore: number;
  frameLossPct: number;
  egoDeficitPct: number;
  tacticalMove: string;
  forensicSummary: string;
  credits_remaining: number;
}

function mapForensicResult(res: BackendForensicResult): ForensicReceiptResult {
  const nodes = res.nodes.map((n, i) => ({
    id: `node-${i}`,
    sender: (n.type === "incoming" || n.type === "target") ? ("them" as const) : ("you" as const),
    text: n.text,
    timestamp: n.time || "",
    latency: n.latency || "",
    badge: n.tag,
    errorCallout: n.type === "unforced_error" ? n.alert : undefined,
    subtextBadge: n.buffer || n.analysis,
    readReceipt: true,
  }));

  return {
    case_id: res.case_id,
    title: res.title,
    node_count: res.nodeCount,
    subtext_score: res.subtextScore,
    frame_loss_pct: res.frameLossPct,
    ego_deficit_pct: res.egoDeficitPct,
    tactical_move: res.tacticalMove,
    forensic_summary: res.forensicSummary,
    raw_ocr_text: nodes.map((n) => `${n.sender === "you" ? "You" : "Them"}: ${n.text}`).join("\n"),
    detected_app: "Chat Screenshot",
    ocr_confidence: 96,
    bubbles_detected: res.nodeCount,
    nodes,
  };
}

export async function analyzeReceipts(params: {
  imageBase64?: string;
  mimeType?: string;
  textContent?: string;
  titleHint?: string;
}): Promise<ForensicReceiptResult> {
  if (params.imageBase64) {
    const { blob, mimeType } = dataUrlToBlob(params.imageBase64);
    const form = new FormData();
    form.append("file", blob, `screenshot.${mimeType.split("/")[1] || "png"}`);
    const res = await apiFetch("/receipts/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return mapForensicResult(await res.json());
  }

  const res = await postJSON<BackendForensicResult>("/receipts/analyze", {
    text_content: params.textContent || "",
  });
  return mapForensicResult(res);
}

export async function getCase(caseId: string): Promise<ForensicReceiptResult> {
  const res = await apiFetch(`/receipts/${caseId}`);
  if (!res.ok) throw new Error(`Failed to load case: ${res.status}`);
  return mapForensicResult(await res.json());
}

interface BackendCaseSummary {
  case_id: string;
  title: string;
  created_at: string;
  subtextScore: number;
  frameLossPct: number;
}

export async function listCases(): Promise<BackendCaseSummary[]> {
  const res = await apiFetch("/receipts/");
  if (!res.ok) return [];
  return res.json();
}

// No standalone OCR endpoint on the backend — OCR + forensic analysis happen together
// in analyzeReceipts(). These return an empty shape so callers that merge
// `ocrRes.field || forensicRes.field` fall through to the real analysis data,
// without spending a second AI call (and a second hit against Groq's rate limit).
export async function performOCR(_params: { imageBase64: string; mimeType?: string }): Promise<OcrResult> {
  return { rawText: "", detectedApp: "", confidence: 0, bubblesDetected: 0, participants: [], bubbles: [] };
}

export async function performOCRFromUrl(imageUrl: string): Promise<OcrResult & { sourceUrl?: string }> {
  return { rawText: "", detectedApp: "", confidence: 0, bubblesDetected: 0, participants: [], bubbles: [], sourceUrl: imageUrl };
}

export async function extractUnifiedOcr(_params: {
  imageBase64?: string;
  mimeType?: string;
  imageUrl?: string;
  textContent?: string;
}): Promise<OcrResult> {
  return { rawText: "", detectedApp: "", confidence: 0, bubblesDetected: 0, participants: [], bubbles: [] };
}

// ---------------------------------------------------------------------------
// 2. Fumble Radar & Draft Detonator
// ---------------------------------------------------------------------------
export interface FumbleAnalysisResult {
  threatLevel: number;
  fumblePct: number;
  survivalChance: number;
  cringeKb: string;
  dignityDeficit: string;
  panicTriggers: string[];
  tacticalCritique: string;
  safeCountermeasures: string[];
}

interface BackendFumbleResult {
  threatLevel: number;
  fumblePct: number;
  survivalChance: number;
  detectedIssues: string[];
  whyBad: string;
  safeCountermeasures: string[];
}

export async function analyzeDraft(draft: string, context?: string): Promise<FumbleAnalysisResult> {
  const res = await postJSON<BackendFumbleResult>("/fumble/analyze", { draft, context });
  return {
    threatLevel: res.threatLevel,
    fumblePct: res.fumblePct,
    survivalChance: res.survivalChance,
    cringeKb: (draft.length * 0.00032).toFixed(2),
    dignityDeficit: `-${res.fumblePct}% Frame Loss`,
    panicTriggers: res.detectedIssues || [],
    tacticalCritique: res.whyBad,
    safeCountermeasures: res.safeCountermeasures || [],
  };
}

// ---------------------------------------------------------------------------
// 3. The Spreadsheet Court (Sparring)
// ---------------------------------------------------------------------------
export interface SparringTurnResult {
  botReply: string;
  fallacy: string;
  frameDelta: number;
  coachTip: string;
}

const PERSONA_MAP: Record<string, string> = {
  defensive_partner: "ex",
  roommate: "chaos",
  boss: "boss",
  landlord: "ghoster",
  friend: "chaos",
};

let sparringSessionId: string | null = null;
let sparringSessionTopic: string | null = null;

async function ensureSparringSession(topic: string, persona: string, aggressiveness: number): Promise<string> {
  if (sparringSessionId && sparringSessionTopic === topic) return sparringSessionId;
  const res = await postJSON<{ session_id: string }>("/sparring/start", {
    topic,
    persona: PERSONA_MAP[persona] || "chaos",
    aggressiveness,
  });
  sparringSessionId = res.session_id;
  sparringSessionTopic = topic;
  return res.session_id;
}

export async function sendSparringParry(params: {
  messages: Array<{ sender: "ai" | "user"; text: string }>;
  topic: string;
  persona: string;
  aggressiveness: number;
  userParry: string;
}): Promise<SparringTurnResult> {
  const sessionId = await ensureSparringSession(params.topic, params.persona, params.aggressiveness);
  const res = await postJSON<{ botReply: string; fallacyUsed?: string; frameShift: number; coachWhisper: string }>(
    `/sparring/${sessionId}/message`,
    { message: params.userParry }
  );
  return {
    botReply: res.botReply,
    fallacy: res.fallacyUsed ? `Fallacy: ${res.fallacyUsed}` : "",
    frameDelta: res.frameShift,
    coachTip: res.coachWhisper,
  };
}

export interface RefereeVerdictResult {
  winner: "user" | "ai" | "draw";
  rulingTitle: string;
  scorecard: {
    timestampAnchoring: string;
    fallaciesDetectedUser: number;
    fallaciesDetectedAi: number;
    finalFrameUser: number;
    finalFrameAi: number;
  };
  arbitratorNote: string;
  cloutPoints: number;
}

export async function getRefereeVerdict(params: {
  messages: Array<{ sender: "ai" | "user"; text: string; fallacy?: string }>;
  topic: string;
  userFrame: number;
}): Promise<RefereeVerdictResult> {
  if (!sparringSessionId) throw new Error("No active sparring session");
  const res = await postJSON<{
    winner: "user" | "ai" | "draw";
    finalFrameUser: number;
    finalFrameAI: number;
    verdictSummary: string;
    lessons: string[];
  }>(`/sparring/${sparringSessionId}/verdict`, {});

  const cloutPoints = res.winner === "user" ? 25 : res.winner === "draw" ? 10 : 5;
  sparringSessionId = null;
  sparringSessionTopic = null;

  return {
    winner: res.winner,
    rulingTitle:
      res.winner === "user"
        ? "VERDICT: USER REIGNS SUPREME"
        : res.winner === "ai"
          ? "VERDICT: OPPONENT PREVAILS"
          : "VERDICT: SPLIT CONCESSION",
    scorecard: {
      timestampAnchoring: res.finalFrameUser >= 60 ? "Flawless" : res.finalFrameUser >= 40 ? "Moderate" : "Vulnerable",
      fallaciesDetectedUser: 0,
      fallaciesDetectedAi: params.messages.filter((m) => m.fallacy).length,
      finalFrameUser: res.finalFrameUser,
      finalFrameAi: res.finalFrameAI,
    },
    arbitratorNote: res.verdictSummary,
    cloutPoints,
  };
}

// ---------------------------------------------------------------------------
// 5. Local Tactician Stats Manager — backed by the real /war-room/stats
// ---------------------------------------------------------------------------
export interface TacticianStats {
  cleanWins: number;
  fumbleFlags: number;
  meltdowns: number;
  auditsCount: number;
  clout: number;
  handle: string;
  level: number;
  credits: number;
  recommendedMove: string | null;
  activeTargetAudit: { case_id: string; title: string; subtextScore: number; frameLossPct: number } | null;
}

const STATS_KEY = "dw_tactician_stats_v3";

const DEFAULT_STATS: TacticianStats = {
  cleanWins: 0,
  fumbleFlags: 0,
  meltdowns: 0,
  auditsCount: 0,
  clout: 0,
  handle: "@tactician",
  level: 1,
  credits: 0,
  recommendedMove: null,
  activeTargetAudit: null,
};

type StatsListener = (stats: TacticianStats) => void;
const statsListeners = new Set<StatsListener>();

export function subscribeStats(listener: StatsListener): () => void {
  statsListeners.add(listener);
  return () => statsListeners.delete(listener);
}

export function getStoredStats(): TacticianStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULT_STATS;
}

export function saveStoredStats(stats: TacticianStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
  statsListeners.forEach((l) => l(stats));
}

interface BackendWarRoomStats {
  handle: string;
  level: number;
  clean_wins: number;
  fumble_flags: number;
  meltdowns: number;
  credits: number;
  recommended_move: string;
  active_target_audit: { case_id: string; title: string; subtext_score: number; frame_loss_pct: number } | null;
}

// Refresh from the real backend. Run at app boot, and again after any action
// that changes server-side stats, so getStoredStats() (read synchronously by
// components on mount) reflects reality rather than a stale/fake default.
export async function refreshStoredStats(): Promise<TacticianStats | null> {
  try {
    const res = await apiFetch("/war-room/stats");
    if (!res.ok) return null;
    const data: BackendWarRoomStats = await res.json();
    const stats: TacticianStats = {
      cleanWins: data.clean_wins,
      fumbleFlags: data.fumble_flags,
      meltdowns: data.meltdowns,
      auditsCount: data.clean_wins + data.fumble_flags + data.meltdowns,
      clout: data.clean_wins * 25,
      handle: `@${data.handle}`,
      level: data.level,
      credits: data.credits,
      recommendedMove: data.recommended_move,
      activeTargetAudit: data.active_target_audit
        ? {
            case_id: data.active_target_audit.case_id,
            title: data.active_target_audit.title,
            subtextScore: data.active_target_audit.subtext_score,
            frameLossPct: data.active_target_audit.frame_loss_pct,
          }
        : null,
    };
    saveStoredStats(stats);
    return stats;
  } catch {
    // offline / cold start — keep whatever's cached locally
    return null;
  }
}

export function recordWin(_cloutDelta: number = 25): TacticianStats {
  const stats = getStoredStats();
  refreshStoredStats();
  return stats;
}

export function recordFumble(): TacticianStats {
  const stats = getStoredStats();
  refreshStoredStats();
  return stats;
}

export function recordMeltdown(): TacticianStats {
  const stats = getStoredStats();
  refreshStoredStats();
  return stats;
}

ensureToken().then(refreshStoredStats);
