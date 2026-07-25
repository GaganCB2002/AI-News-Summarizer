from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.news_service import NewsService, CATEGORIES
from app.services.summary_service import SummaryService
from app.schemas.news import NewsArticleResponse, NewsArticleListResponse
from app.schemas.summary import SummaryResponse
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/news", tags=["news"])


@router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}


@router.get("/countries")
async def get_countries():
    from app.services.news_service import COUNTRIES
    return {"countries": [{"name": name, "code": code} for name, code in COUNTRIES.items()]}


@router.get("", response_model=NewsArticleListResponse)
async def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None, description="Filter by category"),
    source: Optional[str] = None,
    language: Optional[str] = None,
    country: Optional[str] = None,
    query: Optional[str] = None,
    sort_by: str = Query("published_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    service = NewsService(db)
    result = await service.list_articles(
        page=page,
        page_size=page_size,
        category=category,
        source=source,
        language=language,
        country=country,
        query=query,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return NewsArticleListResponse(**result)


@router.get("/search", response_model=NewsArticleListResponse)
async def search_articles(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    source: Optional[str] = None,
    language: Optional[str] = None,
    country: Optional[str] = None,
    sort_by: str = Query("published_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = NewsService(db)
    result = await service.list_articles(
        page=page,
        page_size=page_size,
        category=category,
        source=source,
        language=language,
        country=country,
        query=q,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    from app.services.history_service import HistoryService
    hs = HistoryService(db)
    await hs.record_search(current_user.id, q, result.get("total", 0))
    return NewsArticleListResponse(**result)


@router.get("/trending", response_model=NewsArticleListResponse)
async def get_trending_news(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = NewsService(db)
    items, total = await service.repo.list(
        page=page, page_size=page_size,
        sorts=[("published_at", "desc"), ("created_at", "desc")],
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.get("/{article_id}", response_model=NewsArticleResponse)
async def get_article(article_id: str, db: AsyncSession = Depends(get_db)):
    service = NewsService(db)
    article = await service.get_article(article_id)
    return article


@router.post("/seed/{category}")
async def seed_category(
    category: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    if category.title() not in CATEGORIES:
        raise HTTPException(400, f"Invalid category. Choose from: {', '.join(CATEGORIES)}")
    service = NewsService(db)
    articles = await service.seed_category(category)
    return {"message": f"Seeded {len(articles)} articles for {category}", "count": len(articles)}


@router.get("/{article_id}/summary", response_model=SummaryResponse)
async def get_article_summary(article_id: str, db: AsyncSession = Depends(get_db)):
    service = SummaryService(db)
    summary = await service.get_article_summary(article_id)
    return summary


@router.post("/{article_id}/summarize", response_model=SummaryResponse)
async def summarize_article(
    article_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = NewsService(db)
    summary = await service.summarize_article(article_id, user_id=current_user.id)
    return summary
