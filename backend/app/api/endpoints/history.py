from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.history_service import HistoryService
from app.schemas.history import ReadingHistoryDetailListResponse, SearchHistoryListResponse
from app.schemas.summary import SummaryResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/api/v1/history", tags=["history"])

class RecordReadingRequest(BaseModel):
    reading_time_seconds: int | None = None

@router.get("/reading", response_model=ReadingHistoryDetailListResponse)
async def get_reading_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = HistoryService(db)
    return await service.get_reading_history(current_user.id, page, page_size)

@router.get("/search", response_model=SearchHistoryListResponse)
async def get_search_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = HistoryService(db)
    return await service.get_search_history(current_user.id, page, page_size)

@router.get("/summary", response_model=PaginatedResponse[SummaryResponse])
async def get_summary_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = HistoryService(db)
    result = await service.get_summary_history(current_user.id, page, page_size)
    return PaginatedResponse(**result)

@router.post("/reading/{article_id}")
async def record_reading(
    article_id: str,
    body: RecordReadingRequest = RecordReadingRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = HistoryService(db)
    await service.record_reading(current_user.id, article_id, body.reading_time_seconds)
    return {"message": "Reading recorded"}
