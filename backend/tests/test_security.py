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
