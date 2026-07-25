from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.app_settings import AppSettings, ThemeConfig


class AppSettingsRepository(BaseRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AppSettings)

    async def get_settings(self) -> Optional[AppSettings]:
        query = select(AppSettings).where(AppSettings.id == 1)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_or_create_settings(self) -> AppSettings:
        instance = await self.get_settings()
        if not instance:
            instance = AppSettings(id=1)
            self.session.add(instance)
            await self.session.flush()
            await self.session.refresh(instance)
        return instance

    async def update_settings(self, **kwargs: Any) -> Optional[AppSettings]:
        instance = await self.get_or_create_settings()
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance


class ThemeConfigRepository(BaseRepository):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ThemeConfig)

    async def get_config(self) -> Optional[ThemeConfig]:
        query = select(ThemeConfig).where(ThemeConfig.id == 1)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_or_create_config(self) -> ThemeConfig:
        instance = await self.get_config()
        if not instance:
            instance = ThemeConfig(id=1)
            self.session.add(instance)
            await self.session.flush()
            await self.session.refresh(instance)
        return instance

    async def update_config(self, **kwargs: Any) -> Optional[ThemeConfig]:
        instance = await self.get_or_create_config()
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance
