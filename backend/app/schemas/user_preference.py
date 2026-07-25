from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UserPreferenceUpdate(BaseModel):
    categories: Optional[list] = None
    sources: Optional[list] = None
    languages: Optional[list] = None
    keywords: Optional[list] = None
    summary_length: Optional[str] = Field(None, pattern=r"^(short|medium|long)$")


class UserPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    categories: list
    sources: list
    languages: list
    keywords: list
    summary_length: str
    created_at: datetime
    updated_at: datetime
