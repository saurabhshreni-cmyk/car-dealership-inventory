def register(client, email="buyer@example.com", password="correct-horse", **extra):
    return client.post("/api/auth/register", json={"email": email, "password": password, **extra})


def test_register_creates_normal_user_without_leaking_password(client):
    response = register(client)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "buyer@example.com"
    assert body["role"] == "user"
    assert isinstance(body["id"], int)
    assert "password" not in body and "password_hash" not in body


def test_register_ignores_client_supplied_role(client):
    response = register(client, role="admin")

    assert response.status_code == 201
    assert response.json()["role"] == "user"


def test_register_duplicate_email_is_conflict_case_insensitive(client):
    register(client, email="dup@example.com")

    response = register(client, email="DUP@Example.com")

    assert response.status_code == 409


def test_register_rejects_invalid_email_and_short_password(client):
    assert register(client, email="not-an-email").status_code == 422
    assert register(client, password="short").status_code == 422


def test_register_accepts_a_password_of_exactly_72_bytes(client):
    assert register(client, password="a" * 72).status_code == 201


def test_register_rejects_password_over_72_bytes_even_when_under_72_characters(client):
    multibyte = "é" * 40  # 40 characters, 80 bytes: bcrypt cannot hash this

    response = register(client, password=multibyte)

    assert response.status_code == 422


def test_login_with_overlong_multibyte_password_is_unauthorized_not_a_server_error(client):
    register(client)

    response = client.post("/api/auth/login", json={"email": "buyer@example.com", "password": "é" * 40})

    assert response.status_code == 401
