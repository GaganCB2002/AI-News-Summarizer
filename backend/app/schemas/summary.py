from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SummaryCreate(BaseModel):
    article_id: str
    original_text: str
    summarized_text: str
    model_used: str
    compression_ratio: Optional[float] = None
    user_id: Optional[str] = None

    model_config = ConfigDict(protected_namespaces=())


class SummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    article_id: str
    user_id: Optional[str] = None
    original_text: str
    summarized_text: str
    model_used: str
    compression_ratio: Optional[float] = None
    created_at: datetime


class SummaryVariantRequest(BaseModel):
    article_id: str
    article_title: str | None = None
    article_content: str | None = None


class BulletSummaryResponse(BaseModel):
    summary: str
    bullets: list[str]


class KeywordResponse(BaseModel):
    keywords: list[str]
    relevance: list[float] | None = None


class SentimentResponse(BaseModel):
    sentiment: str
    score: float
    explanation: str | None = None


class ReadingTimeResponse(BaseModel):
    reading_time_minutes: float
    word_count: int
    character_count: int


class BatchSummaryRequest(BaseModel):
    article_ids: list[str]


class BatchSummaryItem(BaseModel):
    article_id: str
    summary: str | None = None
    error: str | None = None


class BatchSummaryResponse(BaseModel):
    summaries: list[BatchSummaryItem]
