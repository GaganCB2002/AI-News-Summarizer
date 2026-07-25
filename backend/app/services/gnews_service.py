import re
import logging
import httpx
from datetime import datetime, timezone
from typing import Optional
from app.config.settings import settings

logger = logging.getLogger("ai_news.gnews_service")

CATEGORY_MAP = {
    "Technology": "technology",
    "Sports": "sports",
    "Entertainment": "entertainment",
    "Politics": "general",
    "Business": "business",
    "Science": "science",
    "Health": "health",
    "Environment": "general",
}

BASE_URL = "https://gnews.io/api/v4"


def _clean_content(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'\s*\[\+\d+ chars\]$', '', text)
    text = re.sub(r'\s*\[\d+ chars\]$', '', text)
    text = re.sub(r'\s*…$', '', text)
    text = re.sub(r'\s*\[\.\.\.\]$', '', text)
    return text.strip()


class GNewsService:
    def __init__(self):
        self.api_key = settings.NEWS_API_KEY_GNEWS

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def fetch_top_headlines(self, category: str, count: int = 10, country: str = "in") -> list[dict]:
        if not self.is_available():
            return []
        gnews_cat = CATEGORY_MAP.get(category, "general")
        params = {
            "category": gnews_cat,
            "lang": "en",
            "country": country,
            "max": min(count, 100),
            "apikey": self.api_key,
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(f"{BASE_URL}/top-headlines", params=params)
                resp.raise_for_status()
                data = resp.json()
                articles = data.get("articles", [])
                return [self._transform_article(a, category, country) for a in articles[:count]]
        except Exception as e:
            logger.warning(f"GNews fetch_top_headlines failed for {category}/{country}: {e}")
            return []

    async def search_news(self, query: str, count: int = 10, country: str = "in") -> list[dict]:
        if not self.is_available():
            return []
        params = {
            "q": query,
            "lang": "en",
            "country": country,
            "max": min(count, 100),
            "apikey": self.api_key,
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(f"{BASE_URL}/search", params=params)
                resp.raise_for_status()
                data = resp.json()
                articles = data.get("articles", [])
                return [self._transform_article(a, "General", country) for a in articles[:count]]
        except Exception as e:
            logger.warning(f"GNews search_news failed for {query}: {e}")
            return []

    def _transform_article(self, article: dict, category: str, country: str = "in") -> dict:
        published = None
        raw_pub = article.get("publishedAt")
        if raw_pub:
            try:
                published = datetime.fromisoformat(raw_pub.replace("Z", "+00:00"))
            except Exception:
                try:
                    published = datetime.strptime(raw_pub.replace("Z", "+00:00").replace(" ", "T"), "%Y-%m-%dT%H:%M:%S%z")
                except Exception:
                    published = datetime.now(timezone.utc)

        image = article.get("image")
        if not image or image == "None":
            image = None

        source_data = article.get("source", {}) or {}
        source_name = ""
        source_url = ""
        if isinstance(source_data, dict):
            source_name = source_data.get("name", "") or ""
            source_url = source_data.get("url", "") or ""
        elif isinstance(source_data, str):
            source_name = source_data

        title = article.get("title", "")
        description = article.get("description", "")
        raw_content = article.get("content", "")

        combined_content = raw_content or description or ""
        combined_content = _clean_content(combined_content)

        if not combined_content:
            combined_content = description

        return {
            "title": title,
            "source": source_name or "GNews",
            "source_url": source_url,
            "description": description,
            "content": combined_content,
            "url": article.get("url", ""),
            "image_url": image or "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
            "author": source_name,
            "published_at": published or datetime.now(timezone.utc),
            "category": category,
            "language": "en",
            "country": country,
        }


gnews_service = GNewsService()
