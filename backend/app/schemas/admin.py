from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class UserAdminUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    roles: Optional[List[str]] = None


class SystemStatsResponse(BaseModel):
    total_users: int
    total_creators: int
    total_editors: int
    total_campaigns: int
    active_campaigns: int
    pending_campaigns: int
    total_submissions: int
    total_platform_views: int
    total_rewards_generated: Decimal
    api_quota_estimated_used: int
    active_workers_count: int


class AuditLogResponse(BaseModel):
    id: int
    actor_user_id: Optional[int] = None
    actor_email: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    previous_state: Optional[Dict[str, Any]] = None
    new_state: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuthLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    event: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BackgroundJobStatus(BaseModel):
    name: str
    schedule: str
    last_run: Optional[datetime] = None
    status: str
    total_tasks_processed: int
