from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, HttpUrl, Field
from app.schemas.campaign import CampaignResponse


class ApplicationCreate(BaseModel):
    pitch_message: str = Field(..., min_length=20)
    proposed_strategy: Optional[str] = None
    portfolio_url: Optional[str] = None


class ApplicationReview(BaseModel):
    status: Optional[str] = None  # "accepted" or "rejected"
    review_notes: Optional[str] = None


class EditorSummary(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ApplicationResponse(BaseModel):
    id: int
    campaign_id: int
    campaign: Optional[CampaignResponse] = None
    editor_id: int
    editor: Optional[EditorSummary] = None
    pitch_message: str
    proposed_strategy: Optional[str] = None
    portfolio_url: Optional[str] = None
    status: str
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SubmissionCreate(BaseModel):
    campaign_id: Optional[int] = None
    youtube_url: str


class YouTubeVideoResponse(BaseModel):
    id: int
    video_id: str
    channel_id: str
    channel_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: int
    published_at: Optional[datetime] = None
    privacy_status: str
    view_count: int
    like_count: int
    comment_count: int
    last_polled_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubmissionResponse(BaseModel):
    id: int
    campaign_id: int
    campaign: Optional[CampaignResponse] = None
    application_id: int
    editor_id: int
    editor: Optional[EditorSummary] = None
    youtube_url: str
    youtube_video_id: str
    status: str
    rejection_reason: Optional[str] = None
    baseline_views: int
    current_views: int
    eligible_views: int
    estimated_earnings: Decimal
    approved_earnings: Decimal
    approved_at: Optional[datetime] = None
    created_at: datetime
    video: Optional[YouTubeVideoResponse] = None

    class Config:
        from_attributes = True


class SubmissionReview(BaseModel):
    status: str  # "approved" or "rejected"
    rejection_reason: Optional[str] = None
