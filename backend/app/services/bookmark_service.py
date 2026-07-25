import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.bookmark_repository import BookmarkRepository
from app.core.exceptions import ConflictException, NotFoundException

logger = logging.getLogger("ai_news.bookmark_service")


class BookmarkService:
    def __init__(self, db: AsyncSession):
        self.repo = BookmarkRepository(db)

    async def add_bookmark(self, user_id: str, article_id: str):
        existing = await self.repo.get_by_user_and_article(user_id, article_id)
        if existing:
            raise ConflictException("Article already bookmarked")
        bookmark = await self.repo.create(user_id=user_id, article_id=article_id)
        return bookmark

    async def remove_bookmark(self, bookmark_id: str, user_id: str):
        bookmark = await self.repo.get(bookmark_id)
        if not bookmark:
            raise NotFoundException("Bookmark not found")
        if bookmark.user_id != user_id:
            raise NotFoundException("Bookmark not found")
        await self.repo.delete(bookmark_id)

    async def list_bookmarks(self, user_id: str, page: int = 1, page_size: int = 20):
        items, total = await self.repo.list_by_user(user_id, page, page_size)
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }
