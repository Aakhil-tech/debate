
import time
from collections import defaultdict, deque
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings

AI_PATH_PREFIXES = ["/receipts/analyze", "/fumble/analyze", "/sparring/"]


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._windows: dict[str, deque] = defaultdict(deque)

    def _get_limit(self, path: str) -> int:
        if any(path.startswith(p) for p in AI_PATH_PREFIXES):
            return settings.RATE_LIMIT_AI_PER_MINUTE
        return settings.RATE_LIMIT_PER_MINUTE

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        limit = self._get_limit(path)
        now = time.time()
        window_key = f"{client_ip}:{path}"
        dq = self._windows[window_key]

        while dq and now - dq[0] > 60:
            dq.popleft()

        if len(dq) >= limit:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Limit: {limit}/minute",
                    "retry_after_seconds": int(60 - (now - dq[0])),
                },
            )

        dq.append(now)
        return await call_next(request)
