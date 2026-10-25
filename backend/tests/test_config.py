import pytest

from app.config import Settings


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("postgres://u:p@host:5432/db", "postgresql+psycopg://u:p@host:5432/db"),
        ("postgresql://u:p@host/db", "postgresql+psycopg://u:p@host/db"),
        ("postgresql+psycopg://u:p@host/db", "postgresql+psycopg://u:p@host/db"),
        ("sqlite:///./local.db", "sqlite:///./local.db"),
    ],
)
def test_database_url_is_normalised_for_the_psycopg_driver(raw, expected):
    settings = Settings(_env_file=None, jwt_secret_key="x" * 32, database_url=raw)

    assert settings.database_url == expected


def test_cors_origins_are_split_and_trimmed():
    settings = Settings(_env_file=None, jwt_secret_key="x" * 32, cors_origins="http://a.test, http://b.test ,")

    assert settings.cors_origin_list == ["http://a.test", "http://b.test"]
