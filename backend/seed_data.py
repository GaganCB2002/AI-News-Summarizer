import asyncio
import httpx
from datetime import datetime, timezone
from sqlalchemy.future import select
from app.database.session import async_session_factory, init_db
from app.models.news_article import NewsArticle
from app.config.settings import settings

async def fetch_currents_news():
    api_key = settings.NEWS_API_KEY_CURRENTS
    if not api_key:
        print("No Currents API key found. Using mock data.")
        return mock_news_data()
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.currentsapi.services/v1/latest-news",
                params={"apiKey": api_key, "language": "en"}
            )
            if response.status_code == 200:
                data = response.json()
                articles = []
                for item in data.get("news", [])[:20]:
                    try:
                        pub_date = datetime.fromisoformat(item.get("published", "").replace("+0000", "+00:00"))
                    except Exception:
                        pub_date = datetime.now(timezone.utc)
                        
                    articles.append({
                        "title": item.get("title", ""),
                        "source": item.get("author", "Currents"),
                        "source_url": item.get("url", ""),
                        "description": item.get("description", ""),
                        "content": item.get("description", ""),
                        "url": item.get("url", ""),
                        "image_url": item.get("image", "") if item.get("image") and item.get("image") != "None" else "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
                        "author": item.get("author", "") or "",
                        "published_at": pub_date,
                        "category": ",".join(item.get("category", ["general"])),
                        "language": item.get("language", "en"),
                        "country": "us"
                    })
                return articles
    except Exception as e:
        print(f"Error fetching from currents: {e}")
    
    return mock_news_data()

def mock_news_data():
    return [
        {
            "title": "Quantum Supremacy: How 2024 is Redefining Architecture",
            "source": "TechDaily",
            "source_url": "https://example.com/1",
            "description": "New developments in cryogenic cooling systems have accelerated the deployment of commercial quantum computing.",
            "content": "New developments in cryogenic cooling systems have accelerated the deployment of commercial quantum computing applications across the industry.",
            "url": "https://example.com/1",
            "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
            "author": "Alice Smith",
            "published_at": datetime.now(timezone.utc),
            "category": "Technology",
            "language": "en",
            "country": "us"
        },
        {
            "title": "The Decentralized Shift: Digital Ledger Technology",
            "source": "Finance Weekly",
            "source_url": "https://example.com/2",
            "description": "A comprehensive report on how major economies are piloting sovereign digital currencies.",
            "content": "A comprehensive report on how major economies are piloting sovereign digital currencies to combat inflation and streamline cross-border payments globally.",
            "url": "https://example.com/2",
            "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
            "author": "Bob Jones",
            "published_at": datetime.now(timezone.utc),
            "category": "Finance",
            "language": "en",
            "country": "us"
        }
    ]

async def seed_db():
    await init_db()
    articles_data = await fetch_currents_news()
    
    async with async_session_factory() as session:
        count = 0
        for data in articles_data:
            result = await session.execute(select(NewsArticle).where(NewsArticle.url == data["url"]))
            if result.scalars().first():
                continue
                
            new_article = NewsArticle(**data)
            session.add(new_article)
            count += 1
            
        await session.commit()
        print(f"Successfully seeded {count} new articles into the database.")

if __name__ == "__main__":
    asyncio.run(seed_db())
