import base64
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# JWT Tokens
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "iat": now, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


# Fernet Token Encryption at Rest (for OAuth refresh & access tokens)
def _get_fernet_cipher() -> Fernet:
    """Derives a valid 32-byte URL-safe base64 Fernet key from the config."""
    key_str = settings.FERNET_ENCRYPTION_KEY or settings.SECRET_KEY
    # Use SHA-256 hash of the key to guarantee 32 bytes, then base64url encode it
    key_hash = hashlib.sha256(key_str.encode("utf-8")).digest()
    fernet_key = base64.urlsafe_b64encode(key_hash)
    return Fernet(fernet_key)


def encrypt_secret(raw_value: str) -> str:
    if not raw_value:
        return ""
    cipher = _get_fernet_cipher()
    return cipher.encrypt(raw_value.encode("utf-8")).decode("utf-8")


def decrypt_secret(encrypted_value: str) -> str:
    if not encrypted_value:
        return ""
    try:
        cipher = _get_fernet_cipher()
        return cipher.decrypt(encrypted_value.encode("utf-8")).decode("utf-8")
    except Exception:
        return ""
