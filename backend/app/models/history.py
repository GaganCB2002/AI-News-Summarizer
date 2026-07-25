import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database.session import Base

class ReadingHistory(Base):
    __tablename__ = "reading_history"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    article_id: Mapped[str] = mapped_column(String(36), ForeignKey("news_articles.id", ondelete="CASCADE"), nullable=False)
    read_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    reading_time_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)

class SearchHistory(Base):
    __tablename__ = "search_history"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    results_count: Mapped[int] = mapped_column(Integer, default=0)
    searched_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
