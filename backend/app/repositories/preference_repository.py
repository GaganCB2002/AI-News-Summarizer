from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.user_preference import UserPreference


class UserPreferenceRepository(BaseRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserPreference)

    async def get_by_user_id(self, user_id: str) -> UserPreference | None:
        query = select(UserPreference).where(UserPreference.user_id == user_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
