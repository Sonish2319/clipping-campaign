from typing import Optional, List
from pydantic import BaseModel, EmailStr


class GoogleAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None
    redirect_uri: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: int
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    roles: List[str]
    selected_role: Optional[str] = None
    needs_onboarding: bool = False


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RoleSelectionRequest(BaseModel):
    role: str  # "creator" or "editor"


class LoginCredentialsRequest(BaseModel):
    email: EmailStr
    password: str
