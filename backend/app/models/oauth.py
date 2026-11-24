from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class OAuthAccount(Base, TimestampMixin):
    __tablename__ = "oauth_accounts"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False, default="google")  # google
    provider_user_id = Column(String(255), nullable=False, index=True)
    encrypted_access_token = Column(Text, nullable=True)
    encrypted_refresh_token = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    scopes = Column(Text, nullable=True)

    user = relationship("User", back_populates="oauth_accounts")


class YouTubeChannel(Base, TimestampMixin):
    __tablename__ = "youtube_channels"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    channel_id = Column(String(100), unique=True, nullable=False, index=True)
    channel_title = Column(String(255), nullable=False)
    custom_url = Column(String(255), nullable=True)
    thumbnail_url = Column(String(1024), nullable=True)
    subscriber_count = Column(BigInteger, default=0)
    video_count = Column(BigInteger, default=0)
    is_verified_owner = Column(Boolean, default=True)

    user = relationship("User", back_populates="youtube_channels")
