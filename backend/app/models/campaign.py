from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Integer, String, Text, Numeric, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    creator_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    original_video_url = Column(String(1024), nullable=False)
    original_video_id = Column(String(50), nullable=False, index=True)
    thumbnail_url = Column(String(1024), nullable=True)
    category = Column(String(100), nullable=False, default="Gaming", index=True)
    target_audience = Column(String(255), nullable=True)
    
    # Financials & Rules
    reward_per_1000_views = Column(Numeric(10, 2), nullable=False, default=2.00)
    max_reward_per_editor = Column(Numeric(10, 2), nullable=False, default=200.00)
    total_budget = Column(Numeric(10, 2), nullable=False, default=500.00)
    remaining_budget = Column(Numeric(10, 2), nullable=False, default=500.00)
    max_editors = Column(Integer, nullable=False, default=10)
    approved_editors_count = Column(Integer, default=0)
    total_views_accumulated = Column(BigInteger, default=0)

    # Durations & Schedule
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    min_clip_duration_sec = Column(Integer, default=15)
    max_clip_duration_sec = Column(Integer, default=60)

    # Rules & Instructions
    instructions = Column(Text, nullable=True)
    required_hashtags = Column(Text, nullable=True)
    required_description_text = Column(Text, nullable=True)
    allowed_rules = Column(Text, nullable=True)
    disallowed_rules = Column(Text, nullable=True)

    # Status: draft, pending_approval, active, paused, completed, rejected, cancelled
    status = Column(String(50), nullable=False, default="draft", index=True)

    # Relationships
    creator = relationship("User", back_populates="campaigns")
    applications = relationship("CampaignApplication", back_populates="campaign", cascade="all, delete-orphan")
    submissions = relationship("CampaignSubmission", back_populates="campaign", cascade="all, delete-orphan")


class CampaignApplication(Base, TimestampMixin):
    __tablename__ = "campaign_applications"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    editor_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    pitch_message = Column(Text, nullable=False)
    proposed_strategy = Column(Text, nullable=True)
    portfolio_url = Column(String(512), nullable=True)
    
    # Status: pending, accepted, rejected, withdrawn
    status = Column(String(50), nullable=False, default="pending", index=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    campaign = relationship("Campaign", back_populates="applications")
    editor = relationship("User", back_populates="applications")
    submissions = relationship("CampaignSubmission", back_populates="application")
