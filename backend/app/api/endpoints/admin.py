import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.database.session import get_db
from app.repositories.user_repository import UserRepository
from app.repositories.news_repository import NewsArticleRepository
from app.repositories.summary_repository import SummaryRepository
from app.repositories.bookmark_repository import BookmarkRepository
from app.repositories.history_repository import ReadingHistoryRepository, SearchHistoryRepository
from app.repositories.app_settings_repository import AppSettingsRepository, ThemeConfigRepository
from app.services.app_settings_service import AppSettingsService
from app.core.dependencies import get_current_superuser
from app.core.security import get_password_hash, generate_uuid
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException
from app.models.user import User
from app.models.news_article import NewsArticle
from app.models.summary import Summary
from app.models.bookmark import Bookmark
from app.models.history import ReadingHistory, SearchHistory
from app.models.app_settings import AppSettings, ThemeConfig
from app.schemas.user import UserResponse, UserUpdate, AdminUserUpdate
from app.schemas.app_settings import AppSettingsUpdate, AppSettingsResponse, ThemeConfigUpdate, ThemeConfigResponse
from app.config.settings import settings

logger = logging.getLogger("ai_news.admin")

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/dashboard")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    user_repo = UserRepository(db)
    news_repo = NewsArticleRepository(db)
    summary_repo = SummaryRepository(db)
    bookmark_repo = BookmarkRepository(db)
    reading_repo = ReadingHistoryRepository(db)
    search_repo = SearchHistoryRepository(db)

    total_users = await user_repo.count()
    active_users = await user_repo.count(filters={"is_active": True})
    total_articles = await news_repo.count()
    total_summaries = await summary_repo.count()
    total_bookmarks = await bookmark_repo.count()
    total_reads = await reading_repo.count()
    total_searches = await search_repo.count()

    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    today_summaries_result = await db.execute(
        select(func.count()).select_from(Summary).where(Summary.created_at >= today_start)
    )
    today_summaries = today_summaries_result.scalar() or 0

    today_articles_result = await db.execute(
        select(func.count()).select_from(NewsArticle).where(NewsArticle.created_at >= today_start)
    )
    today_articles = today_articles_result.scalar() or 0

    today_users_result = await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= today_start)
    )
    today_users = today_users_result.scalar() or 0

    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    ai_providers = {
        "ollama": {"available": bool(settings.OLLAMA_BASE_URL), "model": settings.OLLAMA_MODEL},
        "gemini": {"available": bool(settings.GEMINI_API_KEY), "model": settings.GEMINI_MODEL},
    }
    current_ai_provider = settings.SUMMARY_PROVIDER

    news_providers = {
        "gnews": {"available": bool(settings.NEWS_API_KEY_GNEWS)},
        "newsapi": {"available": bool(settings.NEWS_API_KEY_NEWSAPI)},
        "guardian": {"available": bool(settings.NEWS_API_KEY_GUARDIAN)},
        "mediastack": {"available": bool(settings.NEWS_API_KEY_MEDIASTACK)},
        "currents": {"available": bool(settings.NEWS_API_KEY_CURRENTS)},
    }

    static_dir = "app/static"
    static_size = 0
    if os.path.exists(static_dir):
        for dirpath, _, filenames in os.walk(static_dir):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                try:
                    static_size += os.path.getsize(fp)
                except OSError:
                    pass

    return {
        "stats": {
            "total_users": total_users,
            "active_users": active_users,
            "total_articles": total_articles,
            "total_summaries": total_summaries,
            "total_bookmarks": total_bookmarks,
            "total_reading_history": total_reads,
            "total_search_history": total_searches,
        },
        "today": {
            "new_users": today_users,
            "new_articles": today_articles,
            "new_summaries": today_summaries,
        },
        "system": {
            "database": db_status,
            "database_type": "sqlite" if "sqlite" in str(settings.DATABASE_URL) else "postgresql",
            "current_ai_provider": current_ai_provider,
            "ai_providers": ai_providers,
            "news_providers": news_providers,
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG,
            "storage_used_bytes": static_size,
            "storage_used_mb": round(static_size / (1024 * 1024), 2),
        },
        "timestamp": now.isoformat(),
    }


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    user_repo = UserRepository(db)
    news_repo = NewsArticleRepository(db)
    summary_repo = SummaryRepository(db)
    total_users = await user_repo.count()
    active_users = await user_repo.count(filters={"is_active": True})
    total_articles = await news_repo.count()
    total_summaries = await summary_repo.count()

    static_dir = "app/static"
    static_size = 0
    if os.path.exists(static_dir):
        for dirpath, _, filenames in os.walk(static_dir):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                try:
                    static_size += os.path.getsize(fp)
                except OSError:
                    pass

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_articles": total_articles,
        "total_summaries": total_summaries,
        "api_health": 100,
        "storage_used": static_size,
        "storage_total": 500 * 1024 * 1024,
        "api_uptime": 100,
    }


@router.get("/stats/user-growth")
async def get_user_growth(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    now = datetime.now(timezone.utc)
    months = []
    for i in range(6):
        m = now.month - i
        y = now.year
        if m <= 0:
            m += 12
            y -= 1
        months.append((y, m))
    months.reverse()
    result = []
    for y, m in months:
        start = datetime(y, m, 1, tzinfo=timezone.utc)
        if m == 12:
            end = datetime(y + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = datetime(y, m + 1, 1, tzinfo=timezone.utc)
        count = await db.execute(
            select(func.count()).select_from(User).where(User.created_at >= start, User.created_at < end)
        )
        result.append({"month": f"{y}-{m:02d}", "count": count.scalar() or 0})
    return result


@router.get("/stats/category-distribution")
async def get_category_distribution(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    result = await db.execute(
        select(NewsArticle.category, func.count().label("count"))
        .where(NewsArticle.category.isnot(None))
        .group_by(NewsArticle.category)
        .order_by(func.count().desc())
    )
    return [{"name": row.category, "value": row.count} for row in result.all()]


@router.get("/activity")
async def get_admin_activity(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    recent_users = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit)
    )
    activity = []
    for u in recent_users.scalars().all():
        activity.append({
            "id": str(u.id),
            "action": "joined",
            "user": u.username,
            "target": "",
            "time": u.created_at.isoformat() if u.created_at else "",
            "type": "user",
        })
    return activity


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    is_superuser: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_dir: Optional[str] = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = UserRepository(db)
    filters = {}
    if is_active is not None:
        filters["is_active"] = is_active
    if is_superuser is not None:
        filters["is_superuser"] = is_superuser
    sorts = []
    if sort_by:
        sorts.append((sort_by, sort_dir))

    items, total = await repo.list(
        page=page,
        page_size=page_size,
        filters={**filters, "_search": search} if search else filters,
        search_columns=["email", "username", "full_name"] if search else None,
        sorts=sorts if sorts else None,
    )
    return {
        "items": [UserResponse.model_validate(u) for u in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.post("/users", status_code=201)
async def create_user(
    data: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = UserRepository(db)
    if not data.email or not data.username:
        raise BadRequestException("email and username are required")

    existing_email = await repo.get_by_email(str(data.email) if data.email else "")
    if existing_email:
        raise ConflictException("Email already registered")

    existing_username = await repo.get_by_username(data.username)
    if existing_username:
        raise ConflictException("Username already taken")

    temp_password = generate_uuid()[:12]
    user = await repo.create(
        email=str(data.email),
        username=data.username,
        hashed_password=get_password_hash(temp_password),
        full_name=data.full_name,
        is_active=data.is_active if data.is_active is not None else True,
        is_superuser=data.is_superuser if data.is_superuser is not None else False,
        role=data.role or "user",
    )
    return {
        **UserResponse.model_validate(user).model_dump(),
        "temporary_password": temp_password,
    }


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = UserRepository(db)
    user = await repo.get(user_id)
    if not user:
        raise NotFoundException("User not found")
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    data: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = UserRepository(db)
    user = await repo.get(user_id)
    if not user:
        raise NotFoundException("User not found")

    update_data = data.model_dump(exclude_none=True)

    if "email" in update_data:
        existing = await repo.get_by_email(str(update_data["email"]))
        if existing and existing.id != user_id:
            raise ConflictException("Email already in use")
        update_data["email"] = str(update_data["email"])

    if "username" in update_data:
        existing = await repo.get_by_username(update_data["username"])
        if existing and existing.id != user_id:
            raise ConflictException("Username already taken")

    if "role" in update_data:
        update_data["role"] = update_data["role"]

    updated = await repo.update(user_id, **update_data)
    return UserResponse.model_validate(updated)


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    if user_id == current_user.id:
        raise BadRequestException("Cannot delete yourself")
    repo = UserRepository(db)
    deleted = await repo.delete(user_id)
    if not deleted:
        raise NotFoundException("User not found")


@router.put("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    if user_id == current_user.id:
        raise BadRequestException("Cannot suspend yourself")
    repo = UserRepository(db)
    user = await repo.update(user_id, is_active=False)
    if not user:
        raise NotFoundException("User not found")
    return {"message": "User suspended successfully", "user_id": user_id}


@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = UserRepository(db)
    user = await repo.update(user_id, is_active=True)
    if not user:
        raise NotFoundException("User not found")
    return {"message": "User activated successfully", "user_id": user_id}


@router.put("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = UserRepository(db)
    user = await repo.get(user_id)
    if not user:
        raise NotFoundException("User not found")

    new_password = generate_uuid()[:12]
    await repo.update(user_id, hashed_password=get_password_hash(new_password))
    return {"message": "Password reset successfully", "temporary_password": new_password}


@router.get("/users/{user_id}/activity")
async def get_user_activity(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = UserRepository(db)
    user = await repo.get(user_id)
    if not user:
        raise NotFoundException("User not found")

    summaries_result = await db.execute(
        select(func.count()).select_from(Summary).where(Summary.user_id == user_id)
    )
    summary_count = summaries_result.scalar() or 0

    reads_result = await db.execute(
        select(func.count()).select_from(ReadingHistory).where(ReadingHistory.user_id == user_id)
    )
    read_count = reads_result.scalar() or 0

    searches_result = await db.execute(
        select(func.count()).select_from(SearchHistory).where(SearchHistory.user_id == user_id)
    )
    search_count = searches_result.scalar() or 0

    bookmarks_result = await db.execute(
        select(func.count()).select_from(Bookmark).where(Bookmark.user_id == user_id)
    )
    bookmark_count = bookmarks_result.scalar() or 0

    recent_activity_rows = await db.execute(
        select(Summary.created_at.label("ts"), func.literal("summary").label("type"))
        .where(Summary.user_id == user_id)
        .union_all(
            select(ReadingHistory.read_at.label("ts"), func.literal("read").label("type"))
            .where(ReadingHistory.user_id == user_id)
        )
        .union_all(
            select(SearchHistory.searched_at.label("ts"), func.literal("search").label("type"))
            .where(SearchHistory.user_id == user_id)
        )
        .order_by(text("ts desc"))
        .limit(50)
    )
    recent_activity = [
        {"timestamp": row.ts.isoformat() if hasattr(row.ts, "isoformat") else str(row.ts), "type": row.type}
        for row in recent_activity_rows.all()
    ]

    return {
        "user_id": user_id,
        "summary_count": summary_count,
        "read_count": read_count,
        "search_count": search_count,
        "bookmark_count": bookmark_count,
        "recent_activity": recent_activity,
    }


@router.get("/content/articles")
async def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = NewsArticleRepository(db)
    filters = {}
    if category:
        filters["category"] = category
    if source:
        filters["source"] = source
    if search:
        filters["_search"] = search

    items, total = await repo.list(
        page=page,
        page_size=page_size,
        filters=filters,
        search_columns=["title", "description", "source"] if search else None,
    )
    return {
        "items": [
            {
                "id": a.id,
                "title": a.title,
                "source": a.source,
                "category": a.category,
                "language": a.language,
                "country": a.country,
                "image_url": a.image_url,
                "is_summarized": a.is_summarized,
                "published_at": a.published_at.isoformat() if a.published_at else None,
                "created_at": a.created_at.isoformat(),
            }
            for a in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.delete("/content/articles/{article_id}", status_code=204)
async def delete_article(
    article_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = NewsArticleRepository(db)
    deleted = await repo.delete(article_id)
    if not deleted:
        raise NotFoundException("Article not found")


@router.get("/content/summaries")
async def list_summaries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    model_used: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = SummaryRepository(db)
    filters = {}
    if model_used:
        filters["model_used"] = model_used
    items, total = await repo.list(
        page=page,
        page_size=page_size,
        filters=filters,
    )
    result_items = []
    for s in items:
        article_title = ""
        article = await db.execute(select(NewsArticle).where(NewsArticle.id == s.article_id))
        article_obj = article.scalar_one_or_none()
        if article_obj:
            article_title = article_obj.title
        word_count = len(s.summarized_text.split()) if s.summarized_text else 0
        result_items.append({
            "id": s.id,
            "article_id": s.article_id,
            "article_title": article_title,
            "user_id": s.user_id,
            "content": s.summarized_text,
            "model_used": s.model_used,
            "compression_ratio": s.compression_ratio,
            "word_count": word_count,
            "created_at": s.created_at.isoformat(),
        })
    return {
        "items": result_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.delete("/content/summaries/{summary_id}", status_code=204)
async def delete_summary(
    summary_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = SummaryRepository(db)
    deleted = await repo.delete(summary_id)
    if not deleted:
        raise NotFoundException("Summary not found")


@router.get("/content/bookmarks")
async def list_bookmarks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = BookmarkRepository(db)
    items, total = await repo.list(page=page, page_size=page_size)
    result_items = []
    for b in items:
        article_title = ""
        article_category = ""
        article = await db.execute(select(NewsArticle).where(NewsArticle.id == b.article_id))
        article_obj = article.scalar_one_or_none()
        if article_obj:
            article_title = article_obj.title or ""
            article_category = article_obj.category or ""
        username = ""
        user = await db.execute(select(User).where(User.id == b.user_id))
        user_obj = user.scalar_one_or_none()
        if user_obj:
            username = user_obj.username or ""
        result_items.append({
            "id": b.id,
            "user_id": b.user_id,
            "article_id": b.article_id,
            "article_title": article_title,
            "article_category": article_category,
            "username": username,
            "created_at": b.created_at.isoformat(),
        })
    return {
        "items": result_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.delete("/content/bookmarks/{bookmark_id}", status_code=204)
async def delete_bookmark(
    bookmark_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    repo = BookmarkRepository(db)
    deleted = await repo.delete(bookmark_id)
    if not deleted:
        raise NotFoundException("Bookmark not found")


@router.get("/settings")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    settings_obj = await service.get_settings()
    return AppSettingsResponse.model_validate(settings_obj)


@router.put("/settings")
async def update_settings(
    data: AppSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise BadRequestException("No fields to update")
    settings_obj = await service.update_settings(update_data)
    settings_repo = AppSettingsRepository(db)
    updated = await settings_repo.get_settings()
    return AppSettingsResponse.model_validate(updated)


@router.get("/settings/site")
async def get_site_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    s = await service.get_settings()
    return {
        "site_name": s.site_name,
        "site_logo": s.site_logo or "",
        "site_favicon": s.favicon or "",
        "footer_text": s.footer_text or "",
        "contact_email": s.contact_email or "",
        "default_language": s.default_lang or "en",
        "meta_description": "",
    }


@router.put("/settings/site")
async def update_site_settings(
    data: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    mapping = {
        "site_name": "site_name",
        "site_logo": "site_logo",
        "site_favicon": "favicon",
        "footer_text": "footer_text",
        "contact_email": "contact_email",
        "default_language": "default_lang",
    }
    update = {}
    for field, db_field in mapping.items():
        if field in data:
            update[db_field] = data[field]
    if update:
        await service.update_settings(update)
    return {"message": "Site settings saved"}


@router.get("/settings/system")
async def get_system_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    s = await service.get_settings()
    return {
        "pagination_size": s.pagination_size,
        "cache_ttl_seconds": s.cache_duration,
        "ai_provider": s.ai_model or "ollama",
        "ai_model": s.ai_model or "ollama",
        "news_provider": s.news_provider or "gnews",
        "news_api_key_set": bool(settings.NEWS_API_KEY_GNEWS),
    }


@router.put("/settings/system")
async def update_system_settings(
    data: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    mapping = {
        "pagination_size": "pagination_size",
        "cache_ttl_seconds": "cache_duration",
        "ai_provider": "ai_model",
        "ai_model": "ai_model",
        "news_provider": "news_provider",
    }
    update = {}
    for field, db_field in mapping.items():
        if field in data:
            update[db_field] = data[field]
    if update:
        await service.update_settings(update)
    return {"message": "System settings saved"}


@router.get("/settings/toggles")
async def get_toggle_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    s = await service.get_settings()
    return {
        "maintenance_mode": s.maintenance_mode,
        "registration_enabled": s.registration_open,
    }


@router.put("/settings/toggles")
async def update_toggle_settings(
    data: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    update = {}
    if "maintenance_mode" in data:
        update["maintenance_mode"] = data["maintenance_mode"]
    if "registration_enabled" in data:
        update["registration_open"] = data["registration_enabled"]
    if update:
        await service.update_settings(update)
    return {"message": "Toggles updated"}


@router.get("/theme")
async def get_theme(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    theme = await service.get_theme()
    return ThemeConfigResponse.model_validate(theme)


@router.put("/theme")
async def update_theme(
    data: ThemeConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise BadRequestException("No fields to update")
    await service.update_theme(update_data)
    theme_repo = ThemeConfigRepository(db)
    updated = await theme_repo.get_config()
    return ThemeConfigResponse.model_validate(updated)


@router.post("/theme")
async def apply_theme(
    data: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    service = AppSettingsService(db)
    mapping = {
        "preset": "theme_name",
        "primary_color": "primary_color",
        "accent_color": "accent_color",
        "font_family": "font_family",
        "card_radius": "card_radius",
        "animations_enabled": "animations_enabled",
        "dark_mode_default": "dark_mode_default",
    }
    update = {}
    for field, db_field in mapping.items():
        if field in data:
            update[db_field] = data[field]
    if update:
        await service.update_theme(update)
    return {"message": "Theme applied"}


@router.get("/providers/news")
async def get_news_providers(
    _: User = Depends(get_current_superuser),
):
    return {
        "current": settings.NEWS_API_KEY_GNEWS and "gnews" or "none",
        "providers": {
            "gnews": {
                "available": bool(settings.NEWS_API_KEY_GNEWS),
                "configured": bool(settings.NEWS_API_KEY_GNEWS),
            },
            "newsapi": {
                "available": bool(settings.NEWS_API_KEY_NEWSAPI),
                "configured": bool(settings.NEWS_API_KEY_NEWSAPI),
            },
            "guardian": {
                "available": bool(settings.NEWS_API_KEY_GUARDIAN),
                "configured": bool(settings.NEWS_API_KEY_GUARDIAN),
            },
            "mediastack": {
                "available": bool(settings.NEWS_API_KEY_MEDIASTACK),
                "configured": bool(settings.NEWS_API_KEY_MEDIASTACK),
            },
            "currents": {
                "available": bool(settings.NEWS_API_KEY_CURRENTS),
                "configured": bool(settings.NEWS_API_KEY_CURRENTS),
            },
        },
    }


@router.put("/providers/news")
async def update_news_provider(
    data: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    provider = data.get("provider")
    if not provider:
        raise BadRequestException("provider is required")
    valid_providers = ["gnews", "newsapi", "guardian", "mediastack", "currents"]
    if provider not in valid_providers:
        raise BadRequestException(f"Invalid provider. Must be one of: {', '.join(valid_providers)}")
    repo = AppSettingsRepository(db)
    await repo.update_settings(news_provider=provider)
    return {"message": f"News provider set to {provider}", "provider": provider}


@router.get("/providers/ai")
async def get_ai_providers(
    _: User = Depends(get_current_superuser),
):
    return {
        "current": settings.SUMMARY_PROVIDER,
        "providers": {
            "ollama": {
                "available": bool(settings.OLLAMA_BASE_URL),
                "base_url": settings.OLLAMA_BASE_URL,
                "model": settings.OLLAMA_MODEL,
            },
            "gemini": {
                "available": bool(settings.GEMINI_API_KEY),
                "model": settings.GEMINI_MODEL,
            },
        },
    }


@router.put("/providers/ai")
async def update_ai_provider(
    data: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    provider = data.get("provider")
    if not provider:
        raise BadRequestException("provider is required")
    valid_providers = ["ollama", "gemini"]
    if provider not in valid_providers:
        raise BadRequestException(f"Invalid provider. Must be one of: {', '.join(valid_providers)}")
    repo = AppSettingsRepository(db)
    await repo.update_settings(ai_model=provider)
    return {"message": f"AI provider set to {provider}", "provider": provider}


@router.post("/cache/clear")
async def clear_cache(
    _: User = Depends(get_current_superuser),
):
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL)
        await r.flushdb()
        await r.aclose()
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        logger.warning(f"Cache clear failed (Redis may not be available): {e}")
        return {"message": "Cache clear requested (Redis not available, cache may still be active)"}


@router.get("/health/full")
async def full_health_check(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    checks = {}

    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = {"status": "ok", "type": "sqlite" if "sqlite" in str(settings.DATABASE_URL) else "postgresql"}
    except Exception as e:
        checks["database"] = {"status": "error", "error": str(e)}

    ai_providers = {}
    if settings.SUMMARY_PROVIDER == "ollama":
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                ai_providers["ollama"] = {"status": "ok" if resp.status_code == 200 else "error"}
        except Exception as e:
            ai_providers["ollama"] = {"status": "error", "error": str(e)}
    elif settings.SUMMARY_PROVIDER == "gemini":
        ai_providers["gemini"] = {
            "status": "ok" if settings.GEMINI_API_KEY else "not_configured",
        }
    checks["ai_provider"] = ai_providers

    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=3)
        await r.ping()
        await r.aclose()
        checks["cache"] = {"status": "ok", "type": "redis"}
    except Exception:
        checks["cache"] = {"status": "unavailable", "type": "redis"}

    static_dir = "app/static"
    storage_ok = os.path.exists(static_dir)
    storage_size = 0
    if storage_ok:
        for dirpath, _, filenames in os.walk(static_dir):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                try:
                    storage_size += os.path.getsize(fp)
                except OSError:
                    pass
    checks["storage"] = {
        "status": "ok" if storage_ok else "warning",
        "path": static_dir,
        "exists": storage_ok,
        "size_bytes": storage_size,
        "size_mb": round(storage_size / (1024 * 1024), 2),
    }

    all_ok = all(
        c.get("status") == "ok" or c.get("status") == "unavailable"
        for c in checks.values()
    )
    for provider_dict in checks.values():
        if isinstance(provider_dict, dict):
            for sub in provider_dict.values():
                if isinstance(sub, dict) and sub.get("status") == "error":
                    all_ok = False

    return {
        "status": "healthy" if all_ok else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": checks,
    }
