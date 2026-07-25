from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.history import ReadingHistory, SearchHistory

class ReadingHistoryRepository(BaseRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ReadingHistory)

    async def list_by_user(self, user_id: str, page: int = 1, page_size: int = 20):
        return await self.list(
            page=page, page_size=page_size,
            filters={"user_id": user_id},
            sorts=[("read_at", "desc")],
        )

class SearchHistoryRepository(BaseRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session, SearchHistory)

    async def list_by_user(self, user_id: str, page: int = 1, page_size: int = 20):
        return await self.list(
            page=page, page_size=page_size,
            filters={"user_id": user_id},
            sorts=[("searched_at", "desc")],
        )
