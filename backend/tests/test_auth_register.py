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
