from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    event_type: str
    target_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    notification_ids: list[int]
