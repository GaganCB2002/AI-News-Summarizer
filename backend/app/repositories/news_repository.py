from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.news_article import NewsArticle


from sqlalchemy import delete

class NewsArticleRepository(BaseRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session, NewsArticle)

    async def delete_by_category(self, category: str) -> int:
        stmt = delete(NewsArticle).where(NewsArticle.category.ilike(category))
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount

    async def delete_mock_articles(self) -> int:
        stmt = delete(NewsArticle).where(NewsArticle.source == "BrieflyAI Intelligence")
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount

    async def delete_by_country(self, country: str) -> int:
        stmt = delete(NewsArticle).where(NewsArticle.country == country)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount

    async def count_mock_articles(self) -> int:
        from sqlalchemy import select, func
        stmt = select(func.count()).select_from(NewsArticle).where(NewsArticle.source == "BrieflyAI Intelligence")
        result = await self.session.execute(stmt)
        return result.scalar() or 0
