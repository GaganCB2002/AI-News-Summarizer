from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.config.settings import settings
import time
from collections import defaultdict


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = settings.RATE_LIMIT_PERIOD
        max_requests = settings.RATE_LIMIT_REQUESTS

        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < window
        ]

        if len(self.requests[client_ip]) >= max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "error": True,
                    "code": "RATE_LIMIT",
                    "message": f"Rate limit exceeded. Max {max_requests} requests per {window} seconds.",
                },
            )

        self.requests[client_ip].append(now)
        return await call_next(request)
