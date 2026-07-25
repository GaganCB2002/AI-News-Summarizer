from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.app_settings_repository import AppSettingsRepository, ThemeConfigRepository
from app.models.app_settings import AppSettings, ThemeConfig


class AppSettingsService:
    def __init__(self, db: AsyncSession):
        self.settings_repo = AppSettingsRepository(db)
        self.theme_repo = ThemeConfigRepository(db)

    async def get_settings(self) -> AppSettings:
        return await self.settings_repo.get_or_create_settings()

    async def update_settings(self, data: dict[str, Any]) -> AppSettings:
        return await self.settings_repo.update_settings(**data)

    async def get_theme(self) -> ThemeConfig:
        return await self.theme_repo.get_or_create_config()

    async def update_theme(self, data: dict[str, Any]) -> ThemeConfig:
        return await self.theme_repo.update_config(**data)
