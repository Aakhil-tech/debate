from abc import ABC, abstractmethod
from typing import Any, Optional


class Repository(ABC):
    @abstractmethod
    async def connect(self) -> None: ...

    @abstractmethod
    async def disconnect(self) -> None: ...

    @abstractmethod
    async def register_user(self, email: str, password: str, handle: str) -> dict: ...

    @abstractmethod
    async def authenticate_user(self, email: str, password: str) -> dict: ...

    @abstractmethod
    async def get_user(self, user_id: str) -> Optional[dict]: ...

    @abstractmethod
    async def get_user_by_email(self, email: str) -> Optional[dict]: ...

    @abstractmethod
    async def deduct_credits(self, user_id: str, amount: int) -> int: ...

    @abstractmethod
    async def add_credits(self, user_id: str, amount: int) -> int: ...

    @abstractmethod
    async def increment_stat(self, user_id: str, stat: str) -> None: ...

    @abstractmethod
    async def save_case(
        self, user_id: str, case_id: str, result: dict, image_path: Optional[str]
    ) -> None: ...

    @abstractmethod
    async def list_cases(self, user_id: str, limit: int, offset: int) -> list[dict]: ...

    @abstractmethod
    async def get_case(self, case_id: str, user_id: str) -> Optional[dict]: ...

    @abstractmethod
    async def get_recent_cases(self, user_id: str, limit: int) -> list[dict]: ...

    @abstractmethod
    async def get_most_recent_case(self, user_id: str) -> Optional[dict]: ...

    @abstractmethod
    async def save_image(
        self, user_id: str, case_id: str, filename: str, content: bytes, content_type: str
    ) -> Optional[str]: ...

    @abstractmethod
    async def save_fumble_analysis(
        self,
        analysis_id: str,
        user_id: str,
        threat_level: int,
        fumble_pct: int,
        survival_chance: int,
        draft_length: int,
        draft_text: Optional[str],
    ) -> None: ...

    @abstractmethod
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
    ) -> dict: ...

    @abstractmethod
    async def get_sparring_session(self, session_id: str, user_id: str) -> dict: ...

    @abstractmethod
    async def update_sparring_session(self, session_id: str, **fields: Any) -> None: ...
