
import functools
from datetime import datetime, timezone
from typing import Any, Optional

from supabase import Client, create_client
from gotrue.errors import AuthApiError

from app.config import settings
from app.db.base import Repository
from app.db.errors import AuthError


@functools.lru_cache(maxsize=1)
def _client() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set to use DB_BACKEND=supabase"
        )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


class SupabaseRepository(Repository):
    async def connect(self) -> None:
        pass

    async def disconnect(self) -> None:
        pass


    async def _create_user_row(self, user_id: str, email: str, handle: str) -> dict:
        payload = {
            "id": user_id,
            "email": email,
            "handle": handle,
            "credits": settings.CREDITS_NEW_USER_BONUS,
            "level": 1,
            "clean_wins": 0,
            "fumble_flags": 0,
            "meltdowns": 0,
        }
        res = _client().table("users").insert(payload).execute()
        return res.data[0]

    async def register_user(self, email: str, password: str, handle: str) -> dict:
        try:
            auth_res = _client().auth.admin.create_user(
                {"email": email, "password": password, "email_confirm": True}
            )
        except AuthApiError as e:
            raise ValueError(str(e)) from e
        return await self._create_user_row(auth_res.user.id, email, handle)

    async def authenticate_user(self, email: str, password: str) -> dict:
        try:
            auth_res = _client().auth.sign_in_with_password(
                {"email": email, "password": password}
            )
        except AuthApiError as e:
            raise AuthError("Invalid credentials") from e
        user_id = auth_res.user.id
        user = await self.get_user(user_id)
        if not user:
            user = await self._create_user_row(user_id, email, email.split("@")[0])
        return user

    async def get_user(self, user_id: str) -> Optional[dict]:
        res = _client().table("users").select("*").eq("id", user_id).maybe_single().execute()
        return res.data

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        res = _client().table("users").select("*").eq("email", email).maybe_single().execute()
        return res.data


    async def deduct_credits(self, user_id: str, amount: int) -> int:
        user = await self.get_user(user_id)
        if not user:
            raise ValueError("User not found")
        if user["credits"] < amount:
            raise ValueError(f"Insufficient credits: have {user['credits']}, need {amount}")
        new_balance = user["credits"] - amount
        _client().table("users").update({"credits": new_balance}).eq("id", user_id).execute()
        return new_balance

    async def add_credits(self, user_id: str, amount: int) -> int:
        user = await self.get_user(user_id)
        new_balance = (user["credits"] if user else 0) + amount
        _client().table("users").update({"credits": new_balance}).eq("id", user_id).execute()
        return new_balance

    async def increment_stat(self, user_id: str, stat: str) -> None:
        user = await self.get_user(user_id)
        if not user:
            return
        _client().table("users").update({stat: user.get(stat, 0) + 1}).eq("id", user_id).execute()


    async def save_case(
        self, user_id: str, case_id: str, result: dict, image_path: Optional[str]
    ) -> None:
        payload = {
            "id": case_id,
            "user_id": user_id,
            "title": result.get("title", "Untitled Case"),
            "node_count": result.get("nodeCount", 0),
            "subtext_score": result.get("subtextScore", 0),
            "frame_loss_pct": result.get("frameLossPct", 0),
            "ego_deficit_pct": result.get("egoDeficitPct", 0),
            "tactical_move": result.get("tacticalMove", ""),
            "forensic_summary": result.get("forensicSummary", ""),
            "image_path": image_path,
            "analysis_json": (
                result if not settings.ZERO_LOG_RETENTION
                else {k: v for k, v in result.items() if k != "nodes"}
            ),
        }
        _client().table("cases").insert(payload).execute()

    async def list_cases(self, user_id: str, limit: int, offset: int) -> list[dict]:
        res = (
            _client()
            .table("cases")
            .select("id,title,created_at,subtext_score,frame_loss_pct")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return res.data or []

    async def get_case(self, case_id: str, user_id: str) -> Optional[dict]:
        res = (
            _client()
            .table("cases")
            .select("*")
            .eq("id", case_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return res.data

    async def get_recent_cases(self, user_id: str, limit: int) -> list[dict]:
        res = (
            _client()
            .table("cases")
            .select("id,title,created_at,subtext_score,frame_loss_pct")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data or []

    async def get_most_recent_case(self, user_id: str) -> Optional[dict]:
        res = (
            _client()
            .table("cases")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None

    async def save_image(
        self, user_id: str, case_id: str, filename: str, content: bytes, content_type: str
    ) -> Optional[str]:
        storage_path = f"{user_id}/{case_id}/{filename}"
        try:
            _client().storage.from_(settings.STORAGE_BUCKET).upload(
                path=storage_path,
                file=content,
                file_options={"content-type": content_type},
            )
            return storage_path
        except Exception:
            return None


    async def save_fumble_analysis(
        self,
        analysis_id: str,
        user_id: str,
        threat_level: int,
        fumble_pct: int,
        survival_chance: int,
        draft_length: int,
        draft_text: Optional[str],
    ) -> None:
        _client().table("fumble_analyses").insert(
            {
                "id": analysis_id,
                "user_id": user_id,
                "threat_level": threat_level,
                "fumble_pct": fumble_pct,
                "survival_chance": survival_chance,
                "draft_length": draft_length,
                "draft_text": draft_text,
            }
        ).execute()


    async def create_sparring_session(
        self,
        session_id: str,
        user_id: str,
        topic: str,
        persona: str,
        persona_name: str,
        aggressiveness: int,
        user_frame_pct: int,
        bot_frame_pct: int,
    ) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        payload = {
            "id": session_id,
            "user_id": user_id,
            "topic": topic,
            "persona": persona,
            "persona_name": persona_name,
            "aggressiveness": aggressiveness,
            "user_frame_pct": user_frame_pct,
            "bot_frame_pct": bot_frame_pct,
            "round": 1,
            "status": "active",
            "messages": [],
            "created_at": now,
        }
        _client().table("sparring_sessions").insert(payload).execute()
        return payload

    async def get_sparring_session(self, session_id: str, user_id: str) -> dict:
        res = (
            _client()
            .table("sparring_sessions")
            .select("*")
            .eq("id", session_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not res.data:
            raise LookupError("Session not found")
        return res.data

    async def update_sparring_session(self, session_id: str, **fields: Any) -> None:
        if not fields:
            return
        _client().table("sparring_sessions").update(fields).eq("id", session_id).execute()
