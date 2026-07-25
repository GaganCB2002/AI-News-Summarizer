from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.bookmark_service import BookmarkService
from app.schemas.bookmark import BookmarkCreate, BookmarkResponse, BookmarkListResponse

router = APIRouter(prefix="/api/v1/bookmarks", tags=["bookmarks"])


@router.post("", response_model=BookmarkResponse, status_code=201)
async def add_bookmark(
    data: BookmarkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = BookmarkService(db)
    return await service.add_bookmark(current_user.id, data.article_id)


@router.get("", response_model=BookmarkListResponse)
async def list_bookmarks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = BookmarkService(db)
    return await service.list_bookmarks(current_user.id, page, page_size)


@router.delete("/{bookmark_id}", status_code=204)
async def remove_bookmark(
    bookmark_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = BookmarkService(db)
    await service.remove_bookmark(bookmark_id, current_user.id)
