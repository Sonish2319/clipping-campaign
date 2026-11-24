from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.notification import Notification


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        event_type: str,
        target_url: Optional[str] = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            event_type=event_type,
            target_url=target_url,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def mark_as_read(db: Session, user_id: int, notification_ids: List[int]) -> int:
        updated = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.id.in_(notification_ids))
            .update({"is_read": True}, synchronize_session=False)
        )
        db.commit()
        return updated
