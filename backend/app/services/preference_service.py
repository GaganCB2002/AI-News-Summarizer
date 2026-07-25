from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.preference_repository import UserPreferenceRepository


class PreferenceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserPreferenceRepository(db)

    async def get_preferences(self, user_id: str) -> dict:
        prefs = await self.repo.get_by_user_id(user_id)
        if not prefs:
            prefs = await self.repo.create(user_id=user_id)
        return prefs

    async def update_preferences(self, user_id: str, data: dict) -> dict:
        prefs = await self.repo.get_by_user_id(user_id)
        if not prefs:
            prefs = await self.repo.create(user_id=user_id, **data)
        else:
            prefs = await self.repo.update(prefs.id, **data)
        return prefs
