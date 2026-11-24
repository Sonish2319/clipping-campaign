from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    country: Optional[str] = None
    website_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    social_links: Optional[Dict[str, Any]] = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bio: Optional[str] = None
    country: Optional[str] = None
    website_url: Optional[str] = None
    contact_email: Optional[str] = None
    social_links: Optional[Dict[str, Any]] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    selected_role: Optional[str] = None
    roles: List[str]
    profile: Optional[UserProfileResponse] = None
    created_at: datetime
