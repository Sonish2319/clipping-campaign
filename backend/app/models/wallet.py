from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Numeric, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Wallet(Base, TimestampMixin):
    __tablename__ = "wallets"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    estimated_balance = Column(Numeric(10, 2), default=0.00, nullable=False)
    available_balance = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_paid_out = Column(Numeric(10, 2), default=0.00, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)

    user = relationship("User", back_populates="wallet")
    transactions = relationship("RewardTransaction", back_populates="wallet", cascade="all, delete-orphan")


class RewardTransaction(Base):
    __tablename__ = "reward_transactions"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    wallet_id = Column(BigInteger, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_id = Column(BigInteger, ForeignKey("campaign_submissions.id", ondelete="SET NULL"), nullable=True, index=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_type = Column(String(50), nullable=False)  # accrual, adjustment, approval, payout_simulated
    status = Column(String(50), default="confirmed", nullable=False)  # pending, confirmed, reversed
    views_milestone = Column(BigInteger, default=0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    wallet = relationship("Wallet", back_populates="transactions")
    submission = relationship("CampaignSubmission", back_populates="reward_transactions")
