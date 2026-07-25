from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AppSettingsBase(BaseModel):
    site_name: str = "AI News Summarizer"
    site_logo: Optional[str] = None
    favicon: Optional[str] = None
    footer_text: Optional[str] = None
    contact_email: Optional[str] = None
    default_lang: str = "en"
    default_country: str = "us"
    pagination_size: int = 20
    cache_duration: int = 300
    ai_model: str = "ollama"
    news_provider: str = "gnews"
    maintenance_mode: bool = False
    registration_open: bool = True
    email_notifications: bool = False
    analytics_enabled: bool = True


class AppSettingsUpdate(BaseModel):
    site_name: Optional[str] = None
    site_logo: Optional[str] = None
    favicon: Optional[str] = None
    footer_text: Optional[str] = None
    contact_email: Optional[str] = None
    default_lang: Optional[str] = None
    default_country: Optional[str] = None
    pagination_size: Optional[int] = None
    cache_duration: Optional[int] = None
    ai_model: Optional[str] = None
    news_provider: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    registration_open: Optional[bool] = None
    email_notifications: Optional[bool] = None
    analytics_enabled: Optional[bool] = None


class AppSettingsResponse(AppSettingsBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class ThemeConfigBase(BaseModel):
    theme_name: str = "glass"
    primary_color: str = "#6366f1"
    accent_color: str = "#06b6d4"
    font_family: str = "Inter, system-ui, sans-serif"
    card_radius: str = "16px"
    sidebar_style: str = "floating"
    navbar_layout: str = "default"
    animations_enabled: bool = True
    dark_mode_default: bool = True
    custom_css: Optional[str] = None


class ThemeConfigUpdate(BaseModel):
    theme_name: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None
    card_radius: Optional[str] = None
    sidebar_style: Optional[str] = None
    navbar_layout: Optional[str] = None
    animations_enabled: Optional[bool] = None
    dark_mode_default: Optional[bool] = None
    custom_css: Optional[str] = None


class ThemeConfigResponse(ThemeConfigBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
