from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Integer, String, Text, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class CampaignSubmission(Base, TimestampMixin):
    __tablename__ = "campaign_submissions"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(BigInteger, ForeignKey("campaign_applications.id", ondelete="CASCADE"), nullable=False)
    editor_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    youtube_url = Column(String(1024), nullable=False)
    youtube_video_id = Column(String(50), unique=True, nullable=False, index=True)
    
    # Status: pending_verification, pending_creator_review, approved, rejected, suspended
    status = Column(String(50), nullable=False, default="pending_creator_review", index=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Financial metrics for this submission
    baseline_views = Column(BigInteger, default=0)
    current_views = Column(BigInteger, default=0)
    eligible_views = Column(BigInteger, default=0)
    estimated_earnings = Column(Numeric(10, 2), default=0.00)
    approved_earnings = Column(Numeric(10, 2), default=0.00)
    
    approved_at = Column(DateTime, nullable=True)

    # Relationships
    campaign = relationship("Campaign", back_populates="submissions")
    application = relationship("CampaignApplication", back_populates="submissions")
    editor = relationship("User", back_populates="submissions")
    video = relationship("YouTubeVideo", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    reward_transactions = relationship("RewardTransaction", back_populates="submission")


class YouTubeVideo(Base, TimestampMixin):
    __tablename__ = "youtube_videos"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    submission_id = Column(BigInteger, ForeignKey("campaign_submissions.id", ondelete="CASCADE"), nullable=False, unique=True)
    video_id = Column(String(50), unique=True, nullable=False, index=True)
    
    channel_id = Column(String(100), nullable=False, index=True)
    channel_title = Column(String(255), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String(1024), nullable=True)
    duration_seconds = Column(Integer, default=0)
    published_at = Column(DateTime, nullable=True)
    privacy_status = Column(String(50), default="public")  # public, unlisted, private
    
    # Latest snapshot stats
    view_count = Column(BigInteger, default=0)
    like_count = Column(BigInteger, default=0)
    comment_count = Column(BigInteger, default=0)
    last_polled_at = Column(DateTime, nullable=True)

    submission = relationship("CampaignSubmission", back_populates="video")
    statistics_snapshots = relationship("VideoStatistic", back_populates="video", cascade="all, delete-orphan")


class VideoStatistic(Base):
    __tablename__ = "video_statistics"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    video_id = Column(BigInteger, ForeignKey("youtube_videos.id", ondelete="CASCADE"), nullable=False, index=True)
    view_count = Column(BigInteger, nullable=False)
    like_count = Column(BigInteger, nullable=False, default=0)
    comment_count = Column(BigInteger, nullable=False, default=0)
    view_delta = Column(BigInteger, default=0)
    like_delta = Column(BigInteger, default=0)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    video = relationship("YouTubeVideo", back_populates="statistics_snapshots")
