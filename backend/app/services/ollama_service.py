import json
import logging
import httpx
from typing import Optional
from app.config.settings import settings

logger = logging.getLogger("ai_news.ollama_service")


class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT
        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def _call(self, prompt: str, system: str = "") -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.3, "num_predict": 1024},
        }
        if system:
            payload["system"] = system
        try:
            resp = await self.client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")
        except Exception as e:
            logger.error(f"Ollama call failed: {e}")
            raise

    def _extract_json(self, text: str) -> dict:
        text = text.strip()
        text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(text)

    async def is_available(self) -> bool:
        try:
            resp = await self.client.get(f"{self.base_url}/api/tags", timeout=5)
            return resp.status_code == 200
        except Exception:
            return False

    async def generate_news(self, category: str, count: int = 5) -> list[dict]:
        from datetime import datetime, timezone
        import uuid
        prompt = (
            f"Generate {count} realistic news articles about {category}. "
            "Return ONLY a valid JSON array (no markdown, no code blocks). "
            "Each article must have: title, description, content (50-100 words), "
            'source, source_url, category, url, image_url, author, published_at (ISO date), language ("en"), country ("us").'
        )
        try:
            text = await self._call(prompt)
            articles = self._extract_json(text)
            if isinstance(articles, list):
                return articles[:count]
        except Exception as e:
            logger.warning(f"Ollama generate_news failed: {e}")
        return _fallback_news(category, count)

    async def summarize(self, text: str) -> Optional[str]:
        if not text:
            return None
        prompt = (
            "Provide a concise, professional executive summary of the following news article "
            "in 3-5 sentences. Focus on key facts, main points, and important takeaways.\n\n"
            f"Article:\n{text[:3000]}"
        )
        try:
            result = await self._call(prompt)
            return result.strip()
        except Exception as e:
            logger.warning(f"Ollama summarize failed: {e}")
            return None

    async def generate_bullet_summary(self, content: str) -> dict:
        if not content:
            return {"summary": "", "bullets": []}
        prompt = (
            "Summarize the following news article as a list of bullet points. "
            "Return ONLY a valid JSON object with this exact structure: "
            '{"summary": "<brief overview>", "bullets": ["<bullet1>", "<bullet2>", ...]}\n\n'
            f"Article:\n{content[:3000]}"
        )
        try:
            text = await self._call(prompt)
            return self._extract_json(text)
        except Exception as e:
            logger.warning(f"Ollama bullet_summary failed: {e}")
            return {"summary": "", "bullets": []}

    async def extract_keywords(self, content: str) -> dict:
        if not content:
            return {"keywords": []}
        prompt = (
            "Extract the most important keywords from this article. "
            "Return ONLY a valid JSON object: "
            '{"keywords": ["keyword1", "keyword2", ...]}\n\n'
            f"Article:\n{content[:3000]}"
        )
        try:
            text = await self._call(prompt)
            return self._extract_json(text)
        except Exception as e:
            logger.warning(f"Ollama keywords failed: {e}")
            return {"keywords": []}

    async def analyze_sentiment(self, content: str) -> dict:
        if not content:
            return {"sentiment": "neutral", "score": 0.0, "explanation": None}
        prompt = (
            "Analyze the sentiment of this news article. "
            "Return ONLY a valid JSON object: "
            '{"sentiment": "positive|negative|neutral|mixed", '
            '"score": <float -1.0 to 1.0>, '
            '"explanation": "<brief explanation>"}\n\n'
            f"Article:\n{content[:3000]}"
        )
        try:
            text = await self._call(prompt)
            return self._extract_json(text)
        except Exception as e:
            logger.warning(f"Ollama sentiment failed: {e}")
            return {"sentiment": "neutral", "score": 0.0, "explanation": None}

    async def estimate_reading_time(self, content: str) -> dict:
        word_count = len(content.split())
        char_count = len(content)
        wpm = 200
        minutes = max(1, round(word_count / wpm * 10) / 10)
        return {
            "reading_time_minutes": minutes,
            "word_count": word_count,
            "character_count": char_count,
        }


def _fallback_news(category: str, count: int) -> list[dict]:
    from app.services.gemini_service import gemini_service
    return gemini_service._fallback_news(category, count)


ollama_service = OllamaService()
