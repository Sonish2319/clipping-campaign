from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog, AuthenticationLog


class AuditService:
    @staticmethod
    def log_audit(
        db: Session,
        action: str,
        resource_type: str,
        actor_user_id: Optional[int] = None,
        resource_id: Optional[str] = None,
        previous_state: Optional[Dict[str, Any]] = None,
        new_state: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Records an immutable audit trail entry."""
        log_entry = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            previous_state=previous_state,
            new_state=new_state,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    @staticmethod
    def log_auth(
        db: Session,
        event: str,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuthenticationLog:
        """Records an authentication event."""
        auth_entry = AuthenticationLog(
            user_id=user_id,
            event=event,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(auth_entry)
        db.commit()
        db.refresh(auth_entry)
        return auth_entry
