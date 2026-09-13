const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_KEY = "dw_token";

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body.detail === "string"
        ? body.detail
        : body.detail?.message || `HTTP ${res.status}`;
    throw new ApiError(res.status, message, body.detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}


export interface UserProfile {
  id: string;
  email: string;
  handle: string;
  credits: number;
  level: number;
  clean_wins: number;
  fumble_flags: number;
  meltdowns: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export const authApi = {
  register: (email: string, password: string, handle: string) =>
    request<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, handle }),
    }),
  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<UserProfile>("/auth/me"),
};


export interface CreditsBalance {
  credits: number;
  level: number;
}

export const creditsApi = {
  balance: () => request<CreditsBalance>("/credits/balance"),
  costs: () => request<Record<string, number>>("/credits/costs"),
};


export interface CaseSummary {
  case_id: string;
  title: string;
  created_at: string;
  subtextScore: number;
  frameLossPct: number;
}

export interface ForensicNode {
  type: "outgoing" | "incoming" | "unforced_error" | "target";
  text: string;
  time?: string;
  latency?: string;
  tag?: string;
  buffer?: string;
  alert?: string;
  analysis?: string;
}

export interface SubtextMatrix {
  stated: string;
  actual: string;
  intent: string;
}

export interface ForensicAnalysisResult {
  case_id: string;
  title: string;
  nodeCount: number;
  nodes: ForensicNode[];
  subtextScore: number;
  frameLossPct: number;
  egoDeficitPct: number;
  tacticalMove: string;
  subtextMatrix?: SubtextMatrix;
  tacticalRetorts: string[];
  forensicSummary: string;
  credits_remaining: number;
  created_at?: string;
}

export const receiptsApi = {
  analyzeText: (textContent: string) =>
    request<ForensicAnalysisResult>("/receipts/analyze", {
      method: "POST",
      body: JSON.stringify({ text_content: textContent }),
    }),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ForensicAnalysisResult>("/receipts/upload", {
      method: "POST",
      body: form,
    });
  },
  list: () => request<CaseSummary[]>("/receipts/"),
  get: (caseId: string) => request<ForensicAnalysisResult>(`/receipts/${caseId}`),
};


export interface FumbleResult {
  analysis_id: string;
  threatLevel: number;
  threatLabel: string;
  fumblePct: number;
  survivalChance: number;
  detectedTag: string;
  detectedIssues: string[];
  frameImpact: string;
  whyBad: string;
  safeCountermeasures: string[];
  tacticalAdvice: string;
  tacticalPrinciples: string[];
  credits_remaining: number;
}

export const fumbleApi = {
  analyze: (draft: string, context?: string) =>
    request<FumbleResult>("/fumble/analyze", {
      method: "POST",
      body: JSON.stringify({ draft, context }),
    }),
};


export interface SparringChatMessage {
  sender: "user" | "bot";
  text: string;
  time: string;
}

export interface SparringSession {
  session_id: string;
  topic: string;
  persona: string;
  aggressiveness: number;
  userFramePct: number;
  botFramePct: number;
  round: number;
  status: string;
  messages: SparringChatMessage[];
  created_at: string;
}

export interface SparringTurnResult {
  botReply: string;
  fallacyUsed?: string;
  frameShift: number;
  coachWhisper: string;
  roundStatus: string;
  userFramePct: number;
  botFramePct: number;
  credits_remaining: number;
}

export interface VerdictResult {
  winner: string;
  finalFrameUser: number;
  finalFrameAI: number;
  userMvpMove: string;
  userBiggestFumble: string;
  verdictSummary: string;
  lessons: string[];
  rematchRecommended: boolean;
  session_id: string;
}

export const sparringApi = {
  start: (topic: string, persona = "chaos", aggressiveness = 7) =>
    request<SparringSession>("/sparring/start", {
      method: "POST",
      body: JSON.stringify({ topic, persona, aggressiveness }),
    }),
  sendMessage: (sessionId: string, message: string) =>
    request<SparringTurnResult>(`/sparring/${sessionId}/message`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  get: (sessionId: string) => request<SparringSession>(`/sparring/${sessionId}`),
  verdict: (sessionId: string) =>
    request<VerdictResult>(`/sparring/${sessionId}/verdict`, { method: "POST" }),
};


export interface ActiveTargetAudit {
  case_id: string;
  title: string;
  subtext_score: number;
  frame_loss_pct: number;
}

export interface WarRoomStats {
  handle: string;
  level: number;
  clean_wins: number;
  fumble_flags: number;
  meltdowns: number;
  credits: number;
  recent_cases: CaseSummary[];
  active_target_audit?: ActiveTargetAudit;
  recommended_move: string;
}

export interface ActiveCase {
  case_id?: string;
  title?: string;
  target_message?: string;
  subtext_score?: number;
  frame_loss_pct?: number;
  recommended_reply?: string;
  latency_note?: string;
}

export const warRoomApi = {
  stats: () => request<WarRoomStats>("/war-room/stats"),
  activeCase: () => request<ActiveCase>("/war-room/active-case"),
};
