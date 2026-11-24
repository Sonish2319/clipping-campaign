from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    event_type = Column(String(100), nullable=False, index=True)
    target_url = Column(String(512), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="notifications")


class PlatformSetting(Base, TimestampMixin):
    __tablename__ = "platform_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
