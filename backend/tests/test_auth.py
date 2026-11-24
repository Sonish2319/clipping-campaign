import pytest
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_token,
    encrypt_secret,
    decrypt_secret,
)


def test_password_hashing():
    pwd = "SecretCreator123!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_flow():
    data = {"sub": "123", "email": "creator@test.com", "roles": ["creator"]}
    token = create_access_token(data)
    assert token is not None

    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "123"
    assert decoded["email"] == "creator@test.com"
    assert "creator" in decoded["roles"]


def test_fernet_token_encryption_at_rest():
    secret_token = "ya29.a0ARrdaM_sample_google_oauth_refresh_token_xyz"
    encrypted = encrypt_secret(secret_token)
    assert encrypted != secret_token
    assert len(encrypted) > 20

    decrypted = decrypt_secret(encrypted)
    assert decrypted == secret_token
