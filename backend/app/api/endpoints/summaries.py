from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.summary_service import SummaryService
from app.schemas.summary import (
    SummaryResponse,
    SummaryVariantRequest,
    BulletSummaryResponse,
    KeywordResponse,
    SentimentResponse,
    ReadingTimeResponse,
    BatchSummaryRequest,
    BatchSummaryResponse,
)
from app.schemas.common import PaginatedResponse
from app.core.dependencies import get_current_active_user

router = APIRouter(prefix="/api/v1/summaries", tags=["summaries"])


@router.get("", response_model=PaginatedResponse[SummaryResponse])
async def list_summaries(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    service = SummaryService(db)
    result = await service.list_summaries(page=page, page_size=page_size)
    return PaginatedResponse(**result)


@router.get("/{summary_id}", response_model=SummaryResponse)
async def get_summary(
    summary_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    service = SummaryService(db)
    summary = await service.get_summary(summary_id)
    return summary


@router.delete("/{summary_id}")
async def delete_summary(
    summary_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    service = SummaryService(db)
    await service.delete_summary(summary_id)
    return {"message": "Summary deleted successfully"}


@router.post("/bullet", response_model=BulletSummaryResponse)
async def bullet_summary(
    data: SummaryVariantRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    service = SummaryService(db)
    return await service.generate_bullet_summary(data.article_id)


@router.post("/keywords", response_model=KeywordResponse)
async def keywords(
    data: SummaryVariantRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    service = SummaryService(db)
    return await service.extract_keywords(data.article_id)


@router.post("/sentiment", response_model=SentimentResponse)
async def sentiment(
    data: SummaryVariantRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    service = SummaryService(db)
    return await service.analyze_sentiment(data.article_id)


@router.post("/reading-time", response_model=ReadingTimeResponse)
async def reading_time(
    data: SummaryVariantRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    service = SummaryService(db)
    return await service.estimate_reading_time(data.article_id)


@router.post("/batch", response_model=BatchSummaryResponse)
async def batch_summary(
    data: BatchSummaryRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_active_user),
):
    service = SummaryService(db)
    return await service.batch_summarize(data.article_ids)
