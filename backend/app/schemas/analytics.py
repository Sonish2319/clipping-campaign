from typing import List, Dict, Any, Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class TimeseriesPoint(BaseModel):
    date: str
    views: int
    likes: int
    earnings: Decimal = Decimal("0.00")


class TopEditorPerformance(BaseModel):
    editor_id: int
    editor_name: str
    avatar_url: Optional[str] = None
    channel_name: Optional[str] = None
    total_clips: int
    total_views: int
    total_earnings: Decimal


class TopClipPerformance(BaseModel):
    submission_id: int
    video_title: str
    video_id: str
    thumbnail_url: Optional[str] = None
    editor_name: str
    views: int
    likes: int
    earnings: Decimal


class CreatorAnalyticsResponse(BaseModel):
    total_campaigns: int
    active_campaigns: int
    total_applications: int
    accepted_editors: int
    submitted_clips: int
    total_views: int
    total_likes: int
    total_comments: int
    total_spending: Decimal
    estimated_pending_rewards: Decimal
    timeseries: List[TimeseriesPoint]
    top_editors: List[TopEditorPerformance]
    top_clips: List[TopClipPerformance]


class EditorAnalyticsResponse(BaseModel):
    applied_campaigns: int
    accepted_campaigns: int
    submitted_clips: int
    total_views: int
    total_likes: int
    estimated_earnings: Decimal
    approved_earnings: Decimal
    timeseries: List[TimeseriesPoint]
    top_clips: List[TopClipPerformance]
