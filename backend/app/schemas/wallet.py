from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class WalletResponse(BaseModel):
    id: int
    user_id: int
    estimated_balance: Decimal
    available_balance: Decimal
    total_paid_out: Decimal
    currency: str
    updated_at: datetime

    class Config:
        from_attributes = True


class RewardTransactionResponse(BaseModel):
    id: int
    wallet_id: int
    submission_id: Optional[int] = None
    campaign_id: Optional[int] = None
    amount: Decimal
    transaction_type: str
    status: str
    views_milestone: int
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ManualRewardAdjustment(BaseModel):
    user_id: int
    amount: Decimal
    reason: str
