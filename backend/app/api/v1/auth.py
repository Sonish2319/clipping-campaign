import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    encrypt_secret,
)
from app.models.user import User, Role, UserRole, UserProfile
from app.models.oauth import OAuthAccount
from app.models.wallet import Wallet
from app.schemas.auth import (
    TokenResponse,
    GoogleAuthRequest,
    LoginCredentialsRequest,
    RoleSelectionRequest,
)
from app.schemas.user import UserResponse, UserProfileResponse, UserProfileUpdate
from app.api.deps import get_current_user
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/google/url")
def get_google_auth_url(
    intent: Optional[str] = "login",
    redirect_uri: Optional[str] = None,
):
    """Returns official Google OAuth 2.0 authorization URL."""
    target_redirect = redirect_uri or settings.GOOGLE_REDIRECT_URI
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": target_redirect,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": f"intent={intent}",
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return {"url": auth_url, "client_id": settings.GOOGLE_CLIENT_ID, "redirect_uri": target_redirect}


@router.post("/google/callback", response_model=TokenResponse)
async def google_callback(
    payload: GoogleAuthRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Exchanges Google authorization code for identity tokens with Google OAuth servers,

    creates or retrieves user, encrypts tokens at rest, and issues platform JWTs.
    """
    target_redirect = payload.redirect_uri or settings.GOOGLE_REDIRECT_URI

    # Real Google OAuth exchange
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET and not payload.code.startswith("mock_"):
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": payload.code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": target_redirect,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(token_url, data=token_data)
            if token_resp.status_code != 200:
                err_text = token_resp.text
                print(f"[!] Google token exchange error: {err_text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Google OAuth token exchange failed: {err_text}",
                )
            tokens = token_resp.json()

            # Retrieve authenticated user info from Google userinfo API
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            userinfo_resp = await client.get(
                userinfo_url,
                headers={"Authorization": f"Bearer {tokens.get('access_token')}"},
            )
            if userinfo_resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to retrieve Google user profile.",
                )
            google_profile = userinfo_resp.json()

        email = google_profile.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Google account has no associated email.")

        google_sub = google_profile.get("sub", "")
        full_name = google_profile.get("name") or email.split("@")[0]
        avatar_url = google_profile.get("picture")

        access_token_google = tokens.get("access_token", "")
        refresh_token_google = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in", 3600)
        token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    else:
        # Fallback for mock or local testing
        email = f"google_user_{abs(hash(payload.code)) % 10000}@gmail.com"
        google_sub = f"sub_{abs(hash(payload.code)) % 10000}"
        full_name = f"Google User {payload.code[:6]}"
        avatar_url = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"
        access_token_google = "mock_access_token"
        refresh_token_google = "mock_refresh_token"
        token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    # Find or create User
    user = db.query(User).filter(User.email == email).first()
    is_new = False
    if not user:
        is_new = True
        user = User(
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            is_active=True,
            is_verified=True,
            selected_role=None,  # Will prompt onboarding
        )
        db.add(user)
        db.flush()

        # Create wallet and profile
        db.add(Wallet(user_id=user.id))
        db.add(
            UserProfile(
                user_id=user.id,
                contact_email=email,
            )
        )
    else:
        # Update user name & avatar if changed
        if full_name and not user.full_name:
            user.full_name = full_name
        if avatar_url:
            user.avatar_url = avatar_url

    # Store / update OAuthAccount with Fernet encryption
    oauth_acc = (
        db.query(OAuthAccount)
        .filter(OAuthAccount.user_id == user.id, OAuthAccount.provider == "google")
        .first()
    )
    if not oauth_acc:
        oauth_acc = OAuthAccount(
            user_id=user.id,
            provider="google",
            provider_user_id=google_sub,
            encrypted_access_token=encrypt_secret(access_token_google),
            encrypted_refresh_token=encrypt_secret(refresh_token_google) if refresh_token_google else None,
            expires_at=token_expires_at,
            scopes="openid email profile",
        )
        db.add(oauth_acc)
    else:
        oauth_acc.encrypted_access_token = encrypt_secret(access_token_google)
        if refresh_token_google:
            oauth_acc.encrypted_refresh_token = encrypt_secret(refresh_token_google)
        oauth_acc.expires_at = token_expires_at

    db.commit()
    db.refresh(user)

    roles = [ur.role.name for ur in user.roles]
    needs_onboarding = (user.selected_role is None) or (len(roles) == 0)

    # Issue platform JWT
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "roles": roles}
    )

    AuditService.log_auth(
        db=db,
        event="GOOGLE_LOGIN_SUCCESS",
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        roles=roles,
        selected_role=user.selected_role,
        needs_onboarding=needs_onboarding,
    )


@router.post("/login", response_model=TokenResponse)
def login_with_password(
    credentials: LoginCredentialsRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Email and password login (for demo accounts and administrative fallback)."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
        AuditService.log_auth(
            db=db,
            event="FAILED_LOGIN",
            user_id=user.id if user else None,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended.",
        )

    roles = [ur.role.name for ur in user.roles]
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "roles": roles})

    AuditService.log_auth(
        db=db,
        event="LOGIN_SUCCESS",
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        roles=roles,
        selected_role=user.selected_role,
        needs_onboarding=user.selected_role is None,
    )


@router.post("/onboarding/role")
def select_onboarding_role(
    payload: RoleSelectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Assigns user's primary role during onboarding (creator or editor)."""
    if payload.role not in ["creator", "editor"]:
        raise HTTPException(status_code=400, detail="Role must be 'creator' or 'editor'.")

    role_obj = db.query(Role).filter(Role.name == payload.role).first()
    if not role_obj:
        raise HTTPException(status_code=500, detail=f"Role '{payload.role}' does not exist in database.")

    # Assign role in user_roles if not already assigned
    existing = (
        db.query(UserRole)
        .filter(UserRole.user_id == current_user.id, UserRole.role_id == role_obj.id)
        .first()
    )
    if not existing:
        db.add(UserRole(user_id=current_user.id, role_id=role_obj.id))

    current_user.selected_role = payload.role
    db.commit()

    roles = [ur.role.name for ur in current_user.roles]
    new_token = create_access_token(
        data={"sub": str(current_user.id), "email": current_user.email, "roles": roles}
    )

    return {
        "message": f"Successfully onboarded as {payload.role}.",
        "access_token": new_token,
        "selected_role": current_user.selected_role,
        "roles": roles,
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Returns current user details, profile, and roles."""
    roles = [ur.role.name for ur in current_user.roles]
    profile_res = None
    if current_user.profile:
        profile_res = UserProfileResponse(
            bio=current_user.profile.bio,
            country=current_user.profile.country,
            website_url=current_user.profile.website_url,
            contact_email=current_user.profile.contact_email,
            social_links=current_user.profile.social_links,
        )
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        selected_role=current_user.selected_role,
        roles=roles,
        profile=profile_res,
        created_at=current_user.created_at,
    )


@router.patch("/profile")
def update_profile(
    update_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates user bio, country, website, and social links."""
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    for field, val in update_data.model_dump(exclude_unset=True).items():
        setattr(profile, field, val)

    db.commit()
    return {"message": "Profile updated successfully."}
