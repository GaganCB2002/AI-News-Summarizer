from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.preference_service import PreferenceService
from app.schemas.user_preference import UserPreferenceUpdate, UserPreferenceResponse
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/preferences", tags=["preferences"])


@router.get("", response_model=UserPreferenceResponse)
async def get_preferences(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = PreferenceService(db)
    prefs = await service.get_preferences(current_user.id)
    return prefs


@router.put("", response_model=UserPreferenceResponse)
async def update_preferences(
    data: UserPreferenceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = PreferenceService(db)
    prefs = await service.update_preferences(current_user.id, data.model_dump(exclude_none=True))
    return prefs
