from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationMarkRead
from app.api.deps import get_current_user
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves current user's notifications ordered by newest first."""
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(50)
        .all()
    )
    return notifs


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the number of unread notifications for navbar badges."""
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .count()
    )
    return {"unread_count": count}


@router.post("/read")
def mark_notifications_read(
    payload: NotificationMarkRead,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marks specified notifications as read."""
    updated = NotificationService.mark_as_read(
        db=db,
        user_id=current_user.id,
        notification_ids=payload.notification_ids,
    )
    return {"message": "Notifications marked as read.", "count": updated}
