from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.bookmark import Bookmark


class BookmarkRepository(BaseRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Bookmark)

    async def get_by_user_and_article(self, user_id: str, article_id: str):
        from sqlalchemy import select
        query = select(self.model_class).where(
            self.model_class.user_id == user_id,
            self.model_class.article_id == article_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: str, page: int = 1, page_size: int = 20):
        return await self.list(
            page=page, page_size=page_size,
            filters={"user_id": user_id},
            sorts=[("created_at", "desc")],
        )
