from sqlalchemy import Column, BigInteger, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth-only users
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(1024), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    selected_role = Column(String(50), nullable=True)  # creator, editor (primary selection)

    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    oauth_accounts = relationship("OAuthAccount", back_populates="user", cascade="all, delete-orphan")
    youtube_channels = relationship("YouTubeChannel", back_populates="user", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="creator")
    applications = relationship("CampaignApplication", back_populates="editor")
    submissions = relationship("CampaignSubmission", back_populates="editor")
    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="actor")
    auth_logs = relationship("AuthenticationLog", back_populates="user")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)  # superadmin, creator, editor
    description = Column(String(255), nullable=True)

    users = relationship("UserRole", back_populates="role")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(100), unique=True, nullable=False, index=True)  # campaign:create, etc.
    module = Column(String(50), nullable=False, index=True)
    description = Column(String(255), nullable=True)

    roles = relationship("RolePermission", back_populates="permission")


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)

    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    bio = Column(Text, nullable=True)
    country = Column(String(100), nullable=True)
    website_url = Column(String(512), nullable=True)
    contact_email = Column(String(255), nullable=True)
    social_links = Column(JSON, nullable=True)  # {"twitter": "...", "youtube": "..."}

    user = relationship("User", back_populates="profile")
