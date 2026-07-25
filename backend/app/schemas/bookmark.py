from datetime import datetime
from pydantic import BaseModel


class BookmarkCreate(BaseModel):
    article_id: str


class BookmarkResponse(BaseModel):
    id: str
    user_id: str
    article_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BookmarkListResponse(BaseModel):
    items: list[BookmarkResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
