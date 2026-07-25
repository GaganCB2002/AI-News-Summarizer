from typing import Optional, Any, Generic, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime, timezone


T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20


class ErrorResponse(BaseModel):
    error: bool = True
    code: str
    message: str
    details: Optional[Any] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SuccessResponse(BaseModel):
    error: bool = False
    message: str
    data: Optional[Any] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
