
import json
import uuid
from pathlib import Path
from typing import Any, Optional

import anyio
import asyncpg
import bcrypt

from app.config import settings
from app.db.base import Repository
from app.db.errors import AuthError

_JSON_FIELDS = {"messages", "verdict_json", "analysis_json"}


def _row_to_dict(row: asyncpg.Record) -> dict:
    d = dict(row)
    for k, v in d.items():
        if isinstance(v, uuid.UUID):
            d[k] = str(v)
    return d


def _decode_json_fields(row: dict) -> dict:
    for field in _JSON_FIELDS:
        if isinstance(row.get(field), str):
            row[field] = json.loads(row[field])
    return row


class PostgresRepository(Repository):
    def __init__(self) -> None:
        self._pool: Optional[asyncpg.Pool] = None

    async def connect(self) -> None:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=10)

    async def disconnect(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None

    async def _p(self) -> asyncpg.Pool:
        if self._pool is None:
            await self.connect()
        return self._pool


    async def register_user(self, email: str, password: str, handle: str) -> dict:
        pool = await self._p()
        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        try:
            row = await pool.fetchrow(
                """
                insert into users (email, password_hash, handle, credits)
                values ($1, $2, $3, $4)
                returning *
                """,
                email,
                pw_hash,
                handle,
                settings.CREDITS_NEW_USER_BONUS,
            )
        except asyncpg.UniqueViolationError as e:
            raise ValueError("Email or handle already registered") from e
        return _row_to_dict(row)

    async def authenticate_user(self, email: str, password: str) -> dict:
        pool = await self._p()
        row = await pool.fetchrow("select * from users where email = $1", email)
        if not row or not bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
            raise AuthError("Invalid credentials")
        return _row_to_dict(row)

    async def get_user(self, user_id: str) -> Optional[dict]:
        pool = await self._p()
        row = await pool.fetchrow("select * from users where id = $1", user_id)
        return _row_to_dict(row) if row else None

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        pool = await self._p()
        row = await pool.fetchrow("select * from users where email = $1", email)
        return _row_to_dict(row) if row else None


    async def deduct_credits(self, user_id: str, amount: int) -> int:
        pool = await self._p()
        async with pool.acquire() as conn:
            async with conn.transaction():
                row = await conn.fetchrow(
                    "select credits from users where id = $1 for update", user_id
                )
                if not row:
                    raise ValueError("User not found")
                if row["credits"] < amount:
                    raise ValueError(f"Insufficient credits: have {row['credits']}, need {amount}")
                new_balance = row["credits"] - amount
                await conn.execute(
                    "update users set credits = $1 where id = $2", new_balance, user_id
                )
                return new_balance

    async def add_credits(self, user_id: str, amount: int) -> int:
        pool = await self._p()
        row = await pool.fetchrow(
            "update users set credits = credits + $1 where id = $2 returning credits",
            amount,
            user_id,
        )
        return row["credits"] if row else 0

    async def increment_stat(self, user_id: str, stat: str) -> None:
        if stat not in ("clean_wins", "fumble_flags", "meltdowns"):
            raise ValueError(f"Unknown stat: {stat}")
        pool = await self._p()
        await pool.execute(f"update users set {stat} = {stat} + 1 where id = $1", user_id)


    async def save_case(
        self, user_id: str, case_id: str, result: dict, image_path: Optional[str]
    ) -> None:
        pool = await self._p()
        analysis = (
            result if not settings.ZERO_LOG_RETENTION
            else {k: v for k, v in result.items() if k != "nodes"}
        )
        await pool.execute(
            """
            insert into cases (
                id, user_id, title, node_count, subtext_score, frame_loss_pct,
                ego_deficit_pct, tactical_move, forensic_summary, image_path, analysis_json
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            """,
            case_id,
            user_id,
            result.get("title", "Untitled Case"),
            result.get("nodeCount", 0),
            result.get("subtextScore", 0),
            result.get("frameLossPct", 0),
            result.get("egoDeficitPct", 0),
            result.get("tacticalMove", ""),
            result.get("forensicSummary", ""),
            image_path,
            json.dumps(analysis),
        )

    async def list_cases(self, user_id: str, limit: int, offset: int) -> list[dict]:
        pool = await self._p()
        rows = await pool.fetch(
            """
            select id, title, created_at, subtext_score, frame_loss_pct
            from cases where user_id = $1
            order by created_at desc
            limit $2 offset $3
            """,
            user_id,
            limit,
            offset,
        )
        return [_row_to_dict(r) for r in rows]

    async def get_case(self, case_id: str, user_id: str) -> Optional[dict]:
        pool = await self._p()
        row = await pool.fetchrow(
            "select * from cases where id = $1 and user_id = $2", case_id, user_id
        )
        return _decode_json_fields(_row_to_dict(row)) if row else None

    async def get_recent_cases(self, user_id: str, limit: int) -> list[dict]:
        pool = await self._p()
        rows = await pool.fetch(
            """
            select id, title, created_at, subtext_score, frame_loss_pct
            from cases where user_id = $1
            order by created_at desc
            limit $2
            """,
            user_id,
            limit,
        )
        return [_row_to_dict(r) for r in rows]

    async def get_most_recent_case(self, user_id: str) -> Optional[dict]:
        pool = await self._p()
        row = await pool.fetchrow(
            "select * from cases where user_id = $1 order by created_at desc limit 1",
            user_id,
        )
        return _decode_json_fields(_row_to_dict(row)) if row else None

    async def save_image(
        self, user_id: str, case_id: str, filename: str, content: bytes, content_type: str
    ) -> Optional[str]:
        base = Path(settings.UPLOAD_DIR) / user_id / case_id

        def _write() -> None:
            base.mkdir(parents=True, exist_ok=True)
            (base / filename).write_bytes(content)

        await anyio.to_thread.run_sync(_write)
        return f"{user_id}/{case_id}/{filename}"


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
        pool = await self._p()
        await pool.execute(
            """
            insert into fumble_analyses (
                id, user_id, threat_level, fumble_pct, survival_chance, draft_length, draft_text
            ) values ($1,$2,$3,$4,$5,$6,$7)
            """,
            analysis_id,
            user_id,
            threat_level,
            fumble_pct,
            survival_chance,
            draft_length,
            draft_text,
        )


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
        pool = await self._p()
        row = await pool.fetchrow(
            """
            insert into sparring_sessions (
                id, user_id, topic, persona, persona_name, aggressiveness,
                user_frame_pct, bot_frame_pct
            ) values ($1,$2,$3,$4,$5,$6,$7,$8)
            returning *
            """,
            session_id,
            user_id,
            topic,
            persona,
            persona_name,
            aggressiveness,
            user_frame_pct,
            bot_frame_pct,
        )
        return _decode_json_fields(_row_to_dict(row))

    async def get_sparring_session(self, session_id: str, user_id: str) -> dict:
        pool = await self._p()
        row = await pool.fetchrow(
            "select * from sparring_sessions where id = $1 and user_id = $2",
            session_id,
            user_id,
        )
        if not row:
            raise LookupError("Session not found")
        return _decode_json_fields(_row_to_dict(row))

    async def update_sparring_session(self, session_id: str, **fields: Any) -> None:
        if not fields:
            return
        if "messages" in fields:
            fields["messages"] = json.dumps(fields["messages"])
        if "verdict_json" in fields:
            fields["verdict_json"] = json.dumps(fields["verdict_json"])

        pool = await self._p()
        columns = list(fields.keys())
        set_clause = ", ".join(f'"{col}" = ${i + 2}' for i, col in enumerate(columns))
        await pool.execute(
            f"update sparring_sessions set {set_clause} where id = $1",
            session_id,
            *[fields[c] for c in columns],
        )
