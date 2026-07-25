import asyncio
import logging
import json
from typing import Optional

try:
    from google import genai
    from google.genai.types import GenerateContentConfig
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    GenerateContentConfig = None

from app.config.settings import settings

logger = logging.getLogger("ai_news.gemini_service")

CATEGORIES = ["Technology", "Sports", "Entertainment", "Politics", "Business", "Science", "Health", "Environment"]


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.client = None
        self._init_client()

    def _init_client(self):
        if not self.api_key or not HAS_GEMINI:
            logger.warning("Gemini API key not set or google-genai not installed")
            return
        self.client = genai.Client(api_key=self.api_key)
        logger.info("Gemini client initialized")

    def is_available(self) -> bool:
        return self.client is not None

    def _sync_generate_news(self, category: str, count: int) -> Optional[list[dict]]:
        prompt = f"""Generate {count} realistic news articles about {category}. 
Return ONLY a valid JSON array (no markdown, no code blocks).
Each article must have these exact keys: title (string), description (string), content (string, 50-100 words), source (string), source_url (string, the source's homepage URL), category ("{category}"), url (string, a https://example.com/article/... path), image_url (string, a https://images.unsplash.com/... photo url), author (string), published_at (ISO date string like "2026-07-25T10:00:00Z"), language ("en"), country ("us").
Make the articles sound like real news from today. Vary the sources."""

        config = GenerateContentConfig(max_output_tokens=settings.GEMINI_MAX_TOKENS * 2, temperature=0.9)
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=config,
        )
        text = response.text.strip()
        text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        articles = json.loads(text)
        if isinstance(articles, list):
            return articles[:count]
        return None

    async def generate_news(self, category: str, count: int = 5) -> list[dict]:
        if not self.is_available():
            return self._fallback_news(category, count)

        try:
            articles = await asyncio.to_thread(self._sync_generate_news, category, count)
            if articles:
                return articles
        except Exception as e:
            logger.warning(f"Gemini generate_news failed for {category}: {e}")

        return self._fallback_news(category, count)

    def _sync_summarize(self, text: str) -> Optional[str]:
        prompt = f"""Provide a concise, professional executive summary of the following news article in 3-5 sentences. 
Focus on key facts, main points, and important takeaways. Keep it clear and well-structured.

Article:
{text[:1500]}"""

        config = GenerateContentConfig(max_output_tokens=settings.GEMINI_MAX_TOKENS, temperature=0.3)
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=config,
        )
        return response.text.strip()

    async def summarize(self, text: str) -> Optional[str]:
        if not self.is_available() or not text:
            return None

        try:
            return await asyncio.to_thread(self._sync_summarize, text)
        except Exception as e:
            logger.warning(f"Gemini summarize failed: {e}")
            return None

    def _sync_generate_bullet_summary(self, content: str) -> dict:
        prompt = (
            "Summarize the following news article as a list of bullet points. "
            "Keep each bullet point concise (1-2 sentences). "
            "Return ONLY a valid JSON object (no markdown, no code blocks) "
            'with this exact structure: {"summary": "<brief overview sentence>", "bullets": ["<bullet1>", "<bullet2>", ...]}\n\n'
            f"Article:\n{content[:5000]}"
        )
        config = GenerateContentConfig(max_output_tokens=settings.GEMINI_MAX_TOKENS, temperature=0.3)
        response = self.client.models.generate_content(
            model=self.model_name, contents=prompt, config=config,
        )
        text = response.text.strip()
        text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(text)

    async def generate_bullet_summary(self, content: str) -> dict:
        if not self.is_available() or not content:
            return {"summary": "", "bullets": []}
        try:
            return await asyncio.to_thread(self._sync_generate_bullet_summary, content)
        except Exception as e:
            logger.warning(f"Gemini generate_bullet_summary failed: {e}")
            return {"summary": "", "bullets": []}

    def _sync_extract_keywords(self, content: str) -> dict:
        prompt = (
            "Extract the most important keywords and key phrases from the following news article. "
            "Return ONLY a valid JSON object (no markdown, no code blocks) "
            'with this exact structure: {"keywords": ["keyword1", "keyword2", ...]}\n\n'
            f"Article:\n{content[:5000]}"
        )
        config = GenerateContentConfig(max_output_tokens=settings.GEMINI_MAX_TOKENS, temperature=0.3)
        response = self.client.models.generate_content(
            model=self.model_name, contents=prompt, config=config,
        )
        text = response.text.strip()
        text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(text)

    async def extract_keywords(self, content: str) -> dict:
        if not self.is_available() or not content:
            return {"keywords": []}
        try:
            return await asyncio.to_thread(self._sync_extract_keywords, content)
        except Exception as e:
            logger.warning(f"Gemini extract_keywords failed: {e}")
            return {"keywords": []}

    def _sync_analyze_sentiment(self, content: str) -> dict:
        prompt = (
            "Analyze the sentiment of the following news article. "
            "Return ONLY a valid JSON object (no markdown, no code blocks) "
            'with this exact structure: '
            '{"sentiment": "positive|negative|neutral|mixed", "score": <float between -1.0 and 1.0>, "explanation": "<brief explanation>"}\n\n'
            f"Article:\n{content[:5000]}"
        )
        config = GenerateContentConfig(max_output_tokens=settings.GEMINI_MAX_TOKENS, temperature=0.3)
        response = self.client.models.generate_content(
            model=self.model_name, contents=prompt, config=config,
        )
        text = response.text.strip()
        text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(text)

    async def analyze_sentiment(self, content: str) -> dict:
        if not self.is_available() or not content:
            return {"sentiment": "neutral", "score": 0.0, "explanation": None}
        try:
            return await asyncio.to_thread(self._sync_analyze_sentiment, content)
        except Exception as e:
            logger.warning(f"Gemini analyze_sentiment failed: {e}")
            return {"sentiment": "neutral", "score": 0.0, "explanation": None}

    def _sync_estimate_reading_time(self, content: str) -> dict:
        prompt = (
            "Return ONLY a valid JSON object (no markdown, no code blocks) "
            'with this exact structure: '
            '{"reading_time_minutes": <float>, "word_count": <int>, "character_count": <int>}\n'
            f"Article:\n{content[:5000]}"
        )
        config = GenerateContentConfig(max_output_tokens=settings.GEMINI_MAX_TOKENS, temperature=0.3)
        response = self.client.models.generate_content(
            model=self.model_name, contents=prompt, config=config,
        )
        text = response.text.strip()
        text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(text)

    async def estimate_reading_time(self, content: str) -> dict:
        if not self.is_available() or not content:
            return {"reading_time_minutes": 0.0, "word_count": 0, "character_count": 0}
        try:
            return await asyncio.to_thread(self._sync_estimate_reading_time, content)
        except Exception as e:
            logger.warning(f"Gemini estimate_reading_time failed: {e}")
            return {"reading_time_minutes": 0.0, "word_count": 0, "character_count": 0}

    def _fallback_news(self, category: str, count: int) -> list[dict]:
        fallback = {
            "Technology": [
                {"title": "AI Revolution: New Model Breaks Performance Records", "description": "A breakthrough in neural architecture has resulted in a 40% improvement in inference speed while reducing energy consumption by half.", "content": "Researchers at leading AI labs have unveiled a new neural architecture that achieves unprecedented performance benchmarks. The model demonstrates a 40% improvement in inference speed while consuming 50% less energy than previous state-of-the-art systems. This breakthrough is expected to accelerate adoption of AI across industries. Industry experts are calling this the most significant advancement in AI efficiency in the past five years, with potential applications ranging from mobile devices to data centers."},
                {"title": "Quantum Computing Milestone: 1000-Qubit Processor Unveiled", "description": "The new quantum processor achieves quantum supremacy with stable operations at near-room temperature, revolutionizing computing.", "content": "A major milestone in quantum computing was announced today as researchers unveiled a 1000-qubit processor capable of stable operations at near-room temperature. This development dramatically reduces the cooling requirements for quantum computers, making them more commercially viable. Industry experts predict this will accelerate quantum computing adoption by 5-10 years. The breakthrough could transform drug discovery, cryptography, and climate modeling."},
            ],
            "Sports": [
                {"title": "Championship Final: Underdogs Claim Victory in Overtime Thriller", "description": "In a stunning upset, the underdog team secured their first championship title in franchise history after a dramatic overtime victory that captivated millions.", "content": "In what analysts are calling one of the greatest finals in sports history, the underdog team clinched their first championship title with a breathtaking overtime victory. The game featured multiple lead changes, with the decisive play coming in the final seconds of overtime. Fans erupted in celebration as the team secured their place in history. The victory marks the culmination of an incredible season-long journey."},
                {"title": "Rising Star Breaks Decade-Old Record at International Meet", "description": "A 19-year-old athlete shattered a world record that had stood for over a decade, signaling a new era in the sport.", "content": "A 19-year-old phenom stunned the sporting world by breaking a world record that had remained untouched for over a decade. The young athlete's performance has been hailed as one of the greatest in the sport's history, with experts suggesting this is just the beginning of a legendary career. The previous record holder graciously congratulated the new champion on social media."},
            ],
            "Entertainment": [
                {"title": "Streaming Wars: New Platform Disrupts Market with AI-Curated Content", "description": "A revolutionary streaming service using AI to personalize content has gained 10 million subscribers in its first month, reshaping the entertainment landscape.", "content": "A new streaming platform has taken the entertainment world by storm, amassing 10 million subscribers in its debut month. The service uses advanced AI algorithms to curate personalized content recommendations, resulting in unprecedented user engagement. Traditional streaming giants are now racing to integrate similar AI features into their platforms to remain competitive."},
                {"title": "Indie Film Breaks Box Office Records with Zero Marketing Budget", "description": "A small independent film has become the highest-grossing indie release of the year, driven entirely by word-of-mouth and social media buzz.", "content": "An independent film with no traditional marketing has shattered box office expectations, becoming the highest-grossing indie release of the year. The film's success is attributed to powerful word-of-mouth and social media buzz. Industry analysts are studying the film's release strategy as a potential new model for independent cinema distribution."},
            ],
            "Politics": [
                {"title": "Historic Climate Agreement Reached at Global Summit", "description": "World leaders have signed a landmark climate accord committing to 60% emission reductions by 2035 with a $500 billion green fund.", "content": "In a historic moment for global cooperation, world leaders signed a landmark climate agreement committing to a 60% reduction in carbon emissions by 2035. The accord includes binding targets and a $500 billion green technology fund. Environmental groups have cautiously welcomed the agreement while calling for even more ambitious targets to address the climate crisis."},
                {"title": "Electoral Reform Bill Passes with Bipartisan Support", "description": "A comprehensive electoral reform bill has been passed with rare bipartisan support, modernizing voting systems nationwide.", "content": "In a rare show of bipartisanship, lawmakers passed a comprehensive electoral reform bill that modernizes voting systems and expands access to the ballot box. The legislation includes provisions for secure online voting, automatic voter registration, and standardized polling procedures. Political analysts describe this as the most significant electoral reform in decades."},
            ],
            "Business": [
                {"title": "Global Markets Surge on Tech Sector Optimism", "description": "Stock markets worldwide reached new highs as technology companies reported record quarterly earnings, driving investor confidence.", "content": "Global stock markets surged to record levels today following exceptional quarterly earnings reports from major technology companies. The rally was driven by strong performance in AI, cloud computing, and semiconductor sectors. Analysts have revised their year-end forecasts upward, citing robust corporate fundamentals and favorable economic conditions for continued growth."},
                {"title": "Startup Unicorn Disrupts Traditional Banking Sector", "description": "A fintech startup has reached $10 billion valuation by offering AI-powered banking services that are 10x cheaper than traditional banks.", "content": "A fintech startup has achieved unicorn status with a $10 billion valuation after disrupting the traditional banking sector. The company offers AI-powered banking services that are ten times cheaper than conventional banks, attracting millions of users globally. Traditional financial institutions are now racing to adopt similar technologies to remain relevant in the rapidly evolving market."},
            ],
            "Science": [
                {"title": "CRISPR Breakthrough Enables Precision Gene Editing", "description": "Scientists have developed a new CRISPR technique that reduces off-target effects by 99%, opening new therapeutic possibilities for genetic disorders.", "content": "A team of researchers has unveiled a refined CRISPR gene-editing technique that minimizes off-target mutations by 99%. This breakthrough dramatically improves the safety profile of gene therapies, potentially accelerating clinical applications for genetic disorders. Clinical trials are expected to begin within the next year, bringing hope to millions with genetic conditions."},
            ],
            "Health": [
                {"title": "mRNA Vaccine Technology Shows Promise Against Cancer", "description": "Clinical trials demonstrate that mRNA vaccine technology shows 70% effectiveness in treating melanoma, marking a major breakthrough in cancer therapy.", "content": "New clinical trial results show that mRNA vaccine technology is demonstrating remarkable promise in cancer treatment, with a 70% effectiveness rate against melanoma in early-stage trials. The technology, which proved successful against COVID-19, is now being adapted for personalized cancer vaccines. Researchers are optimistic about expanding trials to other cancer types later this year."},
            ],
            "Environment": [
                {"title": "Renewable Energy Achieves Record Low Costs Globally", "description": "Solar and wind energy costs have fallen below fossil fuels in every major economy, marking a historic turning point in the global energy transition.", "content": "Renewable energy has reached a historic milestone, with solar and wind power now cheaper than fossil fuels in every major economy. The cost of solar energy has fallen by 90% over the past decade, while wind energy costs have dropped by 70%. This economic shift is expected to accelerate the global transition to clean energy significantly over the coming years."},
            ],
        }

        items = fallback.get(category, fallback["Technology"])
        from datetime import datetime, timezone
        import uuid
        timestamp = datetime.now(timezone.utc)
        results = []
        for i, item in enumerate(items[:count]):
            results.append({
                "title": item["title"],
                "description": item["description"],
                "content": item["content"],
                "source": "BrieflyAI Intelligence",
                "source_url": "",
                "category": category,
                "url": f"https://briefly.ai/article/{uuid.uuid4().hex[:8]}",
                "image_url": f"https://images.unsplash.com/photo-{['1550751827-4bd374c3f58b','1635070041078-e363dbe005cb','1551288049-bebda4e38f71','1549490349-8643362247b8','1504639725590-34d0984388bd','1498050108023-c5249f4df085','1519389950473-47ba0277781c','1537498425270-2d3a5c6f8e4a','1558346490-ad71e6c0b4e6','1572947650440-e8a97ef053b2','1486312338219-ce68d2c6f44d','1581091226825-a6a89c1b7c0b'][i % 12]}?auto=format&fit=crop&w=800&q=80",
                "author": "AI Correspondent",
                "published_at": timestamp.isoformat(),
                "language": "en",
                "country": "us",
            })
        return results


gemini_service = GeminiService()
