from datetime import timedelta

import pytest

from app.services.security import (
    InvalidTokenError,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_password_is_not_plaintext_and_verifies():
    hashed = hash_password("s3cret-pass")

    assert hashed != "s3cret-pass"
    assert verify_password("s3cret-pass", hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("s3cret-pass")

    assert verify_password("other-pass", hashed) is False


def test_access_token_round_trips_subject():
    token = create_access_token("42")

    assert decode_access_token(token) == "42"


def test_decode_rejects_expired_token():
    token = create_access_token("42", expires_delta=timedelta(seconds=-1))

    with pytest.raises(InvalidTokenError):
        decode_access_token(token)


def test_decode_rejects_garbage_token():
    with pytest.raises(InvalidTokenError):
        decode_access_token("not-a-jwt")


def _signed(payload: dict, secret: str | None = None, algorithm: str = "HS256") -> str:
    import jwt as pyjwt

    from app.config import get_settings

    return pyjwt.encode(payload, secret or get_settings().jwt_secret_key, algorithm=algorithm)


def test_decode_rejects_validly_signed_token_without_expiry():
    with pytest.raises(InvalidTokenError):
        decode_access_token(_signed({"sub": "1"}))


def test_decode_rejects_validly_signed_token_without_subject():
    from datetime import datetime, timezone

    with pytest.raises(InvalidTokenError):
        decode_access_token(_signed({"exp": datetime.now(timezone.utc) + timedelta(minutes=5)}))


def test_decode_rejects_token_signed_with_another_secret():
    from datetime import datetime, timezone

    forged = _signed({"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}, secret="x" * 40)

    with pytest.raises(InvalidTokenError):
        decode_access_token(forged)


def test_decode_rejects_unsigned_none_algorithm_token():
    import jwt as pyjwt

    unsigned = pyjwt.encode({"sub": "1", "exp": 9999999999}, key=None, algorithm="none")

    with pytest.raises(InvalidTokenError):
        decode_access_token(unsigned)
