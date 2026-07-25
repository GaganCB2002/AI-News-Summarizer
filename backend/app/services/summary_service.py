from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.summary_repository import SummaryRepository
from app.repositories.news_repository import NewsArticleRepository
from app.core.exceptions import NotFoundException
from app.services.summary_provider import get_summary_provider


class SummaryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = SummaryRepository(db)
        self.article_repo = NewsArticleRepository(db)
        self.ai = get_summary_provider()

    async def get_summary(self, summary_id: str) -> dict:
        summary = await self.repo.get(summary_id)
        if not summary:
            raise NotFoundException("Summary not found")
        return summary

    async def get_article_summary(self, article_id: str) -> dict:
        summary = await self.repo.get_by_article_id(article_id)
        if not summary:
            raise NotFoundException("No summary found for this article")
        return summary

    async def list_summaries(
        self, page: int = 1, page_size: int = 20
    ) -> dict:
        items, total = await self.repo.list(page=page, page_size=page_size)
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }

    async def delete_summary(self, summary_id: str) -> bool:
        summary = await self.repo.get(summary_id)
        if not summary:
            raise NotFoundException("Summary not found")
        await self.repo.delete(summary_id)
        await self.article_repo.update(summary.article_id, summary=None, is_summarized=False)
        return True

    async def generate_bullet_summary(self, article_id: str) -> dict:
        article = await self.article_repo.get(article_id)
        if not article:
            raise NotFoundException("Article not found")
        content = f"{article.title}\n\n{article.content or article.description or ''}"
        result = await self.ai.generate_bullet_summary(content)
        return result

    async def extract_keywords(self, article_id: str) -> dict:
        article = await self.article_repo.get(article_id)
        if not article:
            raise NotFoundException("Article not found")
        content = f"{article.title}\n\n{article.content or article.description or ''}"
        result = await self.ai.extract_keywords(content)
        return result

    async def analyze_sentiment(self, article_id: str) -> dict:
        article = await self.article_repo.get(article_id)
        if not article:
            raise NotFoundException("Article not found")
        content = f"{article.title}\n\n{article.content or article.description or ''}"
        result = await self.ai.analyze_sentiment(content)
        return result

    async def estimate_reading_time(self, article_id: str) -> dict:
        article = await self.article_repo.get(article_id)
        if not article:
            raise NotFoundException("Article not found")
        content = f"{article.title}\n\n{article.content or article.description or ''}"
        result = await self.ai.estimate_reading_time(content)
        return result

    async def batch_summarize(self, article_ids: list[str]) -> dict:
        results = []
        for aid in article_ids:
            try:
                article = await self.article_repo.get(aid)
                if not article:
                    results.append({"article_id": aid, "error": "Article not found", "summary": None})
                    continue
                content = f"{article.title}\n\n{article.content or article.description or ''}"
                summary_text = await self.ai.summarize(content)
                results.append({"article_id": aid, "summary": summary_text or "", "error": None})
            except Exception as e:
                results.append({"article_id": aid, "error": str(e), "summary": None})
        return {"summaries": results}
