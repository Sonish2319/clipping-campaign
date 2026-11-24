from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    actor_user_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # CAMPAIGN_APPROVED, VIDEO_SUBMITTED, etc.
    resource_type = Column(String(100), nullable=False, index=True)  # campaign, submission, user, reward
    resource_id = Column(String(100), nullable=True)
    previous_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    actor = relationship("User", back_populates="audit_logs")


class AuthenticationLog(Base):
    __tablename__ = "authentication_logs"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    event = Column(String(100), nullable=False)  # LOGIN_SUCCESS, FAILED_LOGIN, REFRESH_SUCCESS
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="auth_logs")
