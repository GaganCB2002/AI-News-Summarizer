import logging
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.settings import settings
from app.repositories.news_repository import NewsArticleRepository
from app.repositories.summary_repository import SummaryRepository
from app.core.exceptions import NotFoundException
from app.models.news_article import NewsArticle
from app.services.summary_provider import get_summary_provider
from app.services.gnews_service import gnews_service

logger = logging.getLogger("ai_news.news_service")

CATEGORIES = ["Technology", "Sports", "Entertainment", "Politics", "Business", "Science", "Health", "Environment"]

COUNTRIES = {
    "India": "in",
    "USA": "us",
    "United Kingdom": "gb",
    "Canada": "ca",
    "Australia": "au",
    "Germany": "de",
    "France": "fr",
    "Japan": "jp",
    "Brazil": "br",
    "South Africa": "za",
    "Singapore": "sg",
    "UAE": "ae",
}

SEARCH_COLUMNS = ["title", "description", "content", "source"]


class NewsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NewsArticleRepository(db)
        self.summary_repo = SummaryRepository(db)

    async def purge_mock_articles(self):
        deleted = await self.repo.delete_mock_articles()
        if deleted:
            logger.info(f"Cleared {deleted} mock AI-generated articles")

    async def seed_all_categories(self, country: str = "in"):
        if not gnews_service.is_available():
            return
        await self.purge_mock_articles()
        await self.repo.delete_by_country(country)
        for cat in CATEGORIES:
            try:
                await self._fetch_and_store(cat, country)
            except Exception as e:
                logger.warning(f"Seed failed for {cat}/{country}: {e}")

    async def _fetch_and_store(self, category: str, country: str = "in") -> List[NewsArticle]:
        articles_data = await gnews_service.fetch_top_headlines(category, count=10, country=country)
        if not articles_data:
            return []
        created = []
        for data in articles_data:
            if not data.get("url"):
                continue
            raw_pub = data.get("published_at")
            if isinstance(raw_pub, str):
                try:
                    data["published_at"] = datetime.fromisoformat(raw_pub.replace("Z", "+00:00"))
                except Exception:
                    data["published_at"] = datetime.now(timezone.utc)
            existing, total = await self.repo.list(
                filters={"url": data["url"]},
                page=1, page_size=1,
            )
            if total > 0:
                continue
            try:
                article = await self.repo.create(**data)
                created.append(article)
            except Exception as e:
                logger.debug(f"Skipping duplicate article: {e}")
        return created

    async def get_article(self, article_id: str) -> NewsArticle:
        article = await self.repo.get(article_id)
        if not article:
            raise NotFoundException("Article not found")
        return article

    async def list_articles(
        self,
        page: int = 1,
        page_size: int = 20,
        category: Optional[str] = None,
        source: Optional[str] = None,
        language: Optional[str] = None,
        country: Optional[str] = None,
        query: Optional[str] = None,
        sort_by: str = "published_at",
        sort_order: str = "desc",
    ) -> dict:
        filters = {}
        if category and category.lower() != "all":
            filters["category"] = f"_ilike:{category}"
        if source:
            filters["source"] = source
        if language:
            filters["language"] = language
        if country:
            filters["country"] = country
        if query:
            filters["_search"] = query

        sort = [(sort_by, sort_order)]
        items, total = await self.repo.list(
            page=page,
            page_size=page_size,
            filters=filters,
            sorts=sort,
            search_columns=SEARCH_COLUMNS,
        )

        if not query:
            try:
                mock_count = await self.repo.count_mock_articles()
                effective_country = country or "in"
                if mock_count > 0 or total == 0:
                    if gnews_service.is_available():
                        await self.seed_all_categories(effective_country)
                        items, total = await self.repo.list(
                            page=page, page_size=page_size,
                            filters=filters, sorts=sort,
                            search_columns=SEARCH_COLUMNS,
                        )
            except Exception as e:
                logger.warning(f"Auto-seed failed (non-critical): {e}")

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }

    async def get_categories(self) -> List[str]:
        return CATEGORIES

    async def get_countries(self) -> dict:
        return COUNTRIES

    async def summarize_article(self, article_id: str, user_id: str | None = None) -> dict:
        article = await self.get_article(article_id)
        if not article.content and not article.description:
            raise NotFoundException("Article has no content to summarize")

        text = article.content or article.description

        ai = get_summary_provider()
        summary_text = await ai.summarize(text)

        if not summary_text:
            summary_text = self._local_summarize(text)

        model_name = (
            settings.GEMINI_MODEL
            if settings.SUMMARY_PROVIDER == "gemini"
            else settings.OLLAMA_MODEL
        )
        existing = await self.summary_repo.get_by_article_id(article_id)
        if existing:
            summary = await self.summary_repo.update(
                existing.id,
                original_text=text,
                summarized_text=summary_text,
                model_used=model_name,
                user_id=user_id or existing.user_id,
            )
        else:
            summary = await self.summary_repo.create(
                article_id=article_id,
                original_text=text,
                summarized_text=summary_text,
                model_used=model_name,
                compression_ratio=len(summary_text) / max(len(text), 1),
                user_id=user_id,
            )

        await self.repo.update(article_id, summary=summary_text, is_summarized=True)
        return summary

    def _local_summarize(self, text: str) -> str:
        words = text.split()
        if len(words) <= 100:
            return text
        return " ".join(words[:100]) + "..."
