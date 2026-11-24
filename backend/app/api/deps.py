from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole, Role, RolePermission, Permission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extracts and verifies the current authenticated user from Bearer JWT."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended.",
        )

    return user


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Returns the authenticated user if token is valid, or None for public endpoints."""
    if not token:
        return None
    try:
        return get_current_user(token=token, db=db)
    except HTTPException:
        return None


def require_role(allowed_roles: List[str]):
    """Dependency factory that checks if the authenticated user has at least one of the allowed roles."""
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        user_roles = (
            db.query(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .filter(UserRole.user_id == current_user.id)
            .all()
        )
        role_names = [r[0] for r in user_roles]

        # Superadmin always has access
        if "superadmin" in role_names:
            return current_user

        for allowed in allowed_roles:
            if allowed in role_names:
                return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation not permitted. Required role: {', '.join(allowed_roles)}.",
        )

    return role_checker


def require_permission(permission_code: str):
    """Dependency factory that verifies granular permission code."""
    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        # Check if user has permission through any assigned role
        has_perm = (
            db.query(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(UserRole, UserRole.role_id == RolePermission.role_id)
            .filter(UserRole.user_id == current_user.id, Permission.code == permission_code)
            .first()
        )

        if has_perm:
            return current_user

        # Also check superadmin bypass
        is_superadmin = (
            db.query(UserRole)
            .join(Role, Role.id == UserRole.role_id)
            .filter(UserRole.user_id == current_user.id, Role.name == "superadmin")
            .first()
        )
        if is_superadmin:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: missing '{permission_code}'.",
        )

    return permission_checker
