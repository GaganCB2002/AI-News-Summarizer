from datetime import datetime
from pydantic import BaseModel

class ReadingHistoryResponse(BaseModel):
    id: str
    user_id: str
    article_id: str
    read_at: datetime
    reading_time_seconds: int | None = None
    model_config = {"from_attributes": True}


class ReadingHistoryDetailResponse(BaseModel):
    id: str
    user_id: str
    article_id: str
    read_at: datetime
    reading_time_seconds: int | None = None
    article_title: str | None = None
    article_category: str | None = None
    article_image_url: str | None = None
    model_config = {"from_attributes": True}


class ReadingHistoryDetailListResponse(BaseModel):
    items: list[ReadingHistoryDetailResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class ReadingHistoryListResponse(BaseModel):
    items: list[ReadingHistoryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class SearchHistoryResponse(BaseModel):
    id: str
    user_id: str
    query: str
    results_count: int
    searched_at: datetime
    model_config = {"from_attributes": True}

class SearchHistoryListResponse(BaseModel):
    items: list[SearchHistoryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
