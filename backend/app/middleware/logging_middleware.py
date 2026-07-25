import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("app.middleware.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        method = request.method
        path = request.url.path

        response = await call_next(request)

        duration = time.perf_counter() - start_time
        status_code = response.status_code

        logger.info(
            "request completed",
            extra={
                "data": {
                    "method": method,
                    "path": path,
                    "status_code": status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "client_ip": client_ip,
                    "user_agent": user_agent,
                },
            },
        )

        return response
