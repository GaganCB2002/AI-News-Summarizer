from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.summary import Summary


class SummaryRepository(BaseRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Summary)

    async def get_by_article_id(self, article_id: str) -> Summary | None:
        query = select(Summary).where(Summary.article_id == article_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
