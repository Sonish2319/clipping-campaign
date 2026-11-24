from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=20)
    original_video_url: str
    thumbnail_url: Optional[str] = None
    category: str = "Gaming"
    target_audience: Optional[str] = None

    reward_per_1000_views: Decimal = Field(default=Decimal("2.00"), ge=0.50, le=100.00)
    max_reward_per_editor: Decimal = Field(default=Decimal("200.00"), ge=10.00)
    total_budget: Decimal = Field(default=Decimal("500.00"), ge=50.00)
    max_editors: int = Field(default=10, ge=1, le=100)

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_clip_duration_sec: int = Field(default=15, ge=5, le=120)
    max_clip_duration_sec: int = Field(default=60, ge=15, le=180)

    instructions: Optional[str] = None
    required_hashtags: Optional[str] = None
    required_description_text: Optional[str] = None
    allowed_rules: Optional[str] = None
    disallowed_rules: Optional[str] = None
    status: Optional[str] = "draft"  # draft or pending_approval


class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    target_audience: Optional[str] = None
    instructions: Optional[str] = None
    required_hashtags: Optional[str] = None
    required_description_text: Optional[str] = None
    allowed_rules: Optional[str] = None
    disallowed_rules: Optional[str] = None
    min_clip_duration_sec: Optional[int] = None
    max_clip_duration_sec: Optional[int] = None


class CreatorSummary(BaseModel):
    id: int
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class CampaignResponse(BaseModel):
    id: int
    creator_id: int
    creator: Optional[CreatorSummary] = None
    title: str
    slug: str
    description: str
    original_video_url: str
    original_video_id: str
    thumbnail_url: Optional[str] = None
    category: str
    target_audience: Optional[str] = None

    reward_per_1000_views: Decimal
    max_reward_per_editor: Decimal
    total_budget: Decimal
    remaining_budget: Decimal
    max_editors: int
    approved_editors_count: int
    total_views_accumulated: int

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_clip_duration_sec: int
    max_clip_duration_sec: int

    instructions: Optional[str] = None
    required_hashtags: Optional[str] = None
    required_description_text: Optional[str] = None
    allowed_rules: Optional[str] = None
    disallowed_rules: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignListResponse(BaseModel):
    items: List[CampaignResponse]
    total: int
    page: int
    size: int
    pages: int
