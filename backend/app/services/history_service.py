import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.history_repository import ReadingHistoryRepository, SearchHistoryRepository
from app.repositories.news_repository import NewsArticleRepository

logger = logging.getLogger("ai_news.history_service")

class HistoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.reading_repo = ReadingHistoryRepository(db)
        self.search_repo = SearchHistoryRepository(db)
        self.news_repo = NewsArticleRepository(db)

    async def record_reading(self, user_id: str, article_id: str, reading_time_seconds: int | None = None):
        existing, total = await self.reading_repo.list(
            filters={"user_id": user_id, "article_id": article_id},
            page=1, page_size=1,
        )
        if total > 0:
            existing_record = existing[0]
            if reading_time_seconds:
                await self.reading_repo.update(existing_record.id, reading_time_seconds=reading_time_seconds)
            return existing_record
        return await self.reading_repo.create(
            user_id=user_id,
            article_id=article_id,
            reading_time_seconds=reading_time_seconds,
        )

    async def get_reading_history(self, user_id: str, page: int = 1, page_size: int = 20):
        from sqlalchemy import select, func
        from app.models.history import ReadingHistory
        from app.models.news_article import NewsArticle
        query = (
            select(
                ReadingHistory.id,
                ReadingHistory.user_id,
                ReadingHistory.article_id,
                ReadingHistory.read_at,
                ReadingHistory.reading_time_seconds,
                NewsArticle.title.label("article_title"),
                NewsArticle.category.label("article_category"),
                NewsArticle.image_url.label("article_image_url"),
            )
            .join(NewsArticle, ReadingHistory.article_id == NewsArticle.id)
            .where(ReadingHistory.user_id == user_id)
            .order_by(ReadingHistory.read_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        rows = result.all()
        items = []
        for row in rows:
            items.append({
                "id": row.id,
                "user_id": row.user_id,
                "article_id": row.article_id,
                "read_at": row.read_at,
                "reading_time_seconds": row.reading_time_seconds,
                "article_title": row.article_title,
                "article_category": row.article_category,
                "article_image_url": row.article_image_url,
            })
        count_query = select(func.count()).select_from(ReadingHistory).where(ReadingHistory.user_id == user_id)
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }

    async def record_search(self, user_id: str, query: str, results_count: int = 0):
        return await self.search_repo.create(
            user_id=user_id, query=query, results_count=results_count,
        )

    async def get_search_history(self, user_id: str, page: int = 1, page_size: int = 20):
        items, total = await self.search_repo.list_by_user(user_id, page, page_size)
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }

    async def get_summary_history(self, user_id: str, page: int = 1, page_size: int = 20):
        from sqlalchemy import select, func
        from app.models.summary import Summary
        from app.models.bookmark import Bookmark
        from app.models.history import ReadingHistory
        reading_ids = select(Summary.id).join(
            ReadingHistory, Summary.article_id == ReadingHistory.article_id
        ).where(ReadingHistory.user_id == user_id)
        bookmark_ids = select(Summary.id).join(
            Bookmark, Summary.article_id == Bookmark.article_id
        ).where(Bookmark.user_id == user_id)
        summary_ids_subq = reading_ids.union(bookmark_ids).subquery()
        query = select(Summary).where(Summary.id.in_(summary_ids_subq))
        count_query = select(func.count()).select_from(Summary).where(Summary.id.in_(summary_ids_subq))
        items_result = await self.db.execute(
            query.order_by(Summary.created_at.desc()).offset((page-1)*page_size).limit(page_size)
        )
        items = list(items_result.scalars().all())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }
