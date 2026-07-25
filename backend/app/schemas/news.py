from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class NewsArticleCreate(BaseModel):
    title: str
    source: str
    source_url: Optional[str] = None
    url: str
    description: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    country: Optional[str] = None


class NewsArticleUpdate(BaseModel):
    title: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    country: Optional[str] = None
    is_summarized: Optional[bool] = None


class NewsArticleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    source: str
    source_url: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    country: Optional[str] = None
    is_summarized: bool
    created_at: datetime
    updated_at: datetime


class NewsArticleListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    source: str
    url: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    is_summarized: bool
    created_at: datetime


class NewsArticleListResponse(BaseModel):
    items: List[NewsArticleListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
