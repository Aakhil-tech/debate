
from app.config import settings
from app.db.base import Repository

_repo: Repository | None = None


def repo() -> Repository:
    global _repo
    if _repo is None:
        if settings.DB_BACKEND == "supabase":
            from app.db.supabase_repo import SupabaseRepository

            _repo = SupabaseRepository()
        else:
            from app.db.postgres_repo import PostgresRepository

            _repo = PostgresRepository()
    return _repo
