import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.endpoints import auth, news, summaries, preferences, health, admin, analytics, bookmarks, history, password
from app.core.error_handlers import register_exception_handlers
from app.middleware.cors_middleware import setup_cors
from app.middleware.logging_middleware import RequestLoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.database.session import init_db, close_db
from app.core.logging import setup_logging
import logging

logger = logging.getLogger("ai_news.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    await init_db()
    try:
        from seed_users import seed_users
        created = await seed_users()
        if created:
            logger.info(f"Seeded {created} default user(s) on startup")
    except Exception as e:
        logger.warning(f"Auto-seed users skipped: {e}")
    try:
        yield
    except asyncio.CancelledError:
        pass
    finally:
        await close_db()


from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="AI News Summarizer API",
    description="API for the AI News Summarizer",
    version="1.0.0",
    lifespan=lifespan,
)

import os
os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

setup_cors(app)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
register_exception_handlers(app)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(news.router)
app.include_router(summaries.router)
app.include_router(preferences.router)
app.include_router(admin.router)
app.include_router(analytics.router)
app.include_router(bookmarks.router)
app.include_router(history.router)
app.include_router(password.router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "AI News Summarizer backend is running"}
