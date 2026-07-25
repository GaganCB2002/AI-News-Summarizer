from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from datetime import datetime, timedelta, timezone
from app.database.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.news_article import NewsArticle
from app.models.summary import Summary
from app.models.history import ReadingHistory
from app.repositories.news_repository import NewsArticleRepository
from app.repositories.summary_repository import SummaryRepository

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/stats")
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    news_repo = NewsArticleRepository(db)
    summary_repo = SummaryRepository(db)

    total_articles = await news_repo.count()
    total_summaries = await summary_repo.count()

    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    date_col = func.date(NewsArticle.published_at)
    weekly_query = select(
        date_col.label("day"),
        func.count().label("count"),
    ).where(NewsArticle.published_at >= week_ago) \
     .group_by(date_col) \
     .order_by(date_col)

    result = await db.execute(weekly_query)
    weekly_rows = result.all()

    weekly_activity = {}
    for row in weekly_rows:
        day_str = str(row.day)
        weekly_activity[day_str] = row.count

    days = []
    for i in range(7):
        d = (week_ago + timedelta(days=i)).strftime("%Y-%m-%d")
        days.append({"date": d, "count": weekly_activity.get(d, 0)})

    cat_query = select(
        NewsArticle.category,
        func.count().label("count"),
    ).where(NewsArticle.category.isnot(None)) \
     .group_by(NewsArticle.category) \
     .order_by(func.count().desc())

    cat_result = await db.execute(cat_query)
    categories = [{"name": row.category, "count": row.count} for row in cat_result.all()]

    source_query = select(
        NewsArticle.source,
        func.count().label("count"),
    ).where(NewsArticle.source.isnot(None)) \
     .group_by(NewsArticle.source) \
     .order_by(func.count().desc()) \
     .limit(5)

    source_result = await db.execute(source_query)
    top_sources = [{"name": row.source, "count": row.count} for row in source_result.all()]

    reading_time_saved = total_summaries * 3.5

    return {
        "total_articles": total_articles,
        "total_summaries": total_summaries,
        "reading_time_saved": round(reading_time_saved, 1),
        "weekly_activity": days,
        "category_distribution": categories,
        "top_sources": top_sources,
    }


@router.get("/categories")
async def analytics_categories(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    result = await db.execute(
        select(NewsArticle.category, func.count().label("count"))
        .where(NewsArticle.category.isnot(None))
        .group_by(NewsArticle.category)
        .order_by(func.count().desc())
    )
    categories = [{"category": row[0], "count": row[1]} for row in result.all()]
    return {"categories": categories, "total": sum(c["count"] for c in categories)}


@router.get("/activity")
async def analytics_activity(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    summaries_result = await db.execute(
        select(func.date(Summary.created_at), func.count())
        .where(Summary.created_at >= cutoff)
        .group_by(func.date(Summary.created_at))
        .order_by(func.date(Summary.created_at))
    )
    activity = [{"date": str(row[0]), "summaries": row[1]} for row in summaries_result.all()]
    return {"activity": activity, "days": days}


@router.get("/usage")
async def analytics_usage(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    today = datetime.now(timezone.utc).date()
    today_start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    today_result = await db.execute(
        select(func.count()).select_from(Summary).where(Summary.created_at >= today_start)
    )
    today_count = today_result.scalar() or 0
    week_start = today_start - timedelta(days=7)
    week_result = await db.execute(
        select(func.count()).select_from(Summary).where(Summary.created_at >= week_start)
    )
    week_count = week_result.scalar() or 0
    month_start = today_start - timedelta(days=30)
    month_result = await db.execute(
        select(func.count()).select_from(Summary).where(Summary.created_at >= month_start)
    )
    month_count = month_result.scalar() or 0
    total_result = await db.execute(select(func.count()).select_from(Summary))
    total_count = total_result.scalar() or 0
    return {
        "today": today_count,
        "this_week": week_count,
        "this_month": month_count,
        "total": total_count,
    }


@router.get("/me")
async def get_my_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user_id = current_user.id

    total_read = await db.execute(
        select(func.count()).select_from(ReadingHistory).where(ReadingHistory.user_id == user_id)
    )
    total_read_count = total_read.scalar() or 0

    total_time = await db.execute(
        select(func.coalesce(func.sum(ReadingHistory.reading_time_seconds), 0))
        .where(ReadingHistory.user_id == user_id, ReadingHistory.reading_time_seconds.isnot(None))
    )
    total_reading_seconds = total_time.scalar() or 0

    my_summaries = await db.execute(
        select(func.count()).select_from(Summary).where(Summary.user_id == user_id)
    )
    my_summary_count = my_summaries.scalar() or 0

    cat_read_query = select(
        NewsArticle.category,
        func.count().label("count"),
    ).join(ReadingHistory, NewsArticle.id == ReadingHistory.article_id) \
     .where(ReadingHistory.user_id == user_id, NewsArticle.category.isnot(None)) \
     .group_by(NewsArticle.category) \
     .order_by(func.count().desc())

    cat_result = await db.execute(cat_read_query)
    category_reads = [{"name": row.category, "count": row.count} for row in cat_result.all()]

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    daily_reads_query = select(
        func.date(ReadingHistory.read_at).label("day"),
        func.count().label("reads"),
        func.coalesce(func.sum(ReadingHistory.reading_time_seconds), 0).label("time"),
    ).where(
        ReadingHistory.user_id == user_id,
        ReadingHistory.read_at >= seven_days_ago,
    ).group_by(func.date(ReadingHistory.read_at)).order_by(func.date(ReadingHistory.read_at))

    daily_result = await db.execute(daily_reads_query)
    daily_rows = daily_result.all()

    daily_activity_map = {}
    for row in daily_rows:
        daily_activity_map[str(row.day)] = {"reads": row.reads, "time_seconds": row.time}

    daily_activity = []
    for i in range(7):
        d = (seven_days_ago + timedelta(days=i)).strftime("%Y-%m-%d")
        entry = daily_activity_map.get(d, {"reads": 0, "time_seconds": 0})
        daily_activity.append({"date": d, "reads": entry["reads"], "time_seconds": entry["time_seconds"]})

    top_articles_query = (
        select(
            NewsArticle.id,
            NewsArticle.title,
            NewsArticle.category,
            func.count(ReadingHistory.id).label("read_count"),
            func.coalesce(func.sum(ReadingHistory.reading_time_seconds), 0).label("total_time"),
        )
        .join(ReadingHistory, NewsArticle.id == ReadingHistory.article_id)
        .where(ReadingHistory.user_id == user_id)
        .group_by(NewsArticle.id, NewsArticle.title, NewsArticle.category)
        .order_by(func.count(ReadingHistory.id).desc())
        .limit(10)
    )
    top_result = await db.execute(top_articles_query)
    top_articles = [
        {
            "id": row.id,
            "title": row.title,
            "category": row.category,
            "read_count": row.read_count,
            "total_time_seconds": row.total_time,
        }
        for row in top_result.all()
    ]

    return {
        "total_articles_read": total_read_count,
        "total_reading_time_minutes": round(total_reading_seconds / 60, 1),
        "total_summaries_generated": my_summary_count,
        "category_breakdown": category_reads,
        "daily_activity": daily_activity,
        "top_articles": top_articles,
    }
