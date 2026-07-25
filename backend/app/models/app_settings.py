from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.session import Base


class AppSettings(Base):
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    site_name: Mapped[str] = mapped_column(String(255), default="AI News Summarizer")
    site_logo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    favicon: Mapped[str | None] = mapped_column(String(500), nullable=True)
    footer_text: Mapped[str | None] = mapped_column(String(500), nullable=True, default="Powered by AI News Summarizer")
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    default_lang: Mapped[str] = mapped_column(String(10), default="en")
    default_country: Mapped[str] = mapped_column(String(10), default="us")
    pagination_size: Mapped[int] = mapped_column(Integer, default=20)
    cache_duration: Mapped[int] = mapped_column(Integer, default=300)
    ai_model: Mapped[str] = mapped_column(String(255), default="ollama")
    news_provider: Mapped[str] = mapped_column(String(255), default="gnews")
    maintenance_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    registration_open: Mapped[bool] = mapped_column(Boolean, default=True)
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=False)
    analytics_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class ThemeConfig(Base):
    __tablename__ = "theme_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    theme_name: Mapped[str] = mapped_column(String(50), default="glass")
    primary_color: Mapped[str] = mapped_column(String(50), default="#6366f1")
    accent_color: Mapped[str] = mapped_column(String(50), default="#06b6d4")
    font_family: Mapped[str] = mapped_column(String(255), default="Inter, system-ui, sans-serif")
    card_radius: Mapped[str] = mapped_column(String(20), default="16px")
    sidebar_style: Mapped[str] = mapped_column(String(50), default="floating")
    navbar_layout: Mapped[str] = mapped_column(String(50), default="default")
    animations_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    dark_mode_default: Mapped[bool] = mapped_column(Boolean, default=True)
    custom_css: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
