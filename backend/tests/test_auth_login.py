from app.services.security import decode_access_token


def register(client, email="buyer@example.com", password="correct-horse"):
    return client.post("/api/auth/register", json={"email": email, "password": password})


def login(client, email="buyer@example.com", password="correct-horse"):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_login_returns_bearer_token_and_user(client):
    user_id = register(client).json()["id"]

    response = login(client)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert decode_access_token(body["access_token"]) == str(user_id)
    assert body["user"] == {"id": user_id, "email": "buyer@example.com", "role": "user"}


def test_login_email_is_case_insensitive(client):
    register(client)

    assert login(client, email="BUYER@example.com").status_code == 200


def test_login_wrong_password_is_unauthorized(client):
    register(client)

    response = login(client, password="wrong-password")

    assert response.status_code == 401


def test_login_unknown_email_is_unauthorized_with_same_message(client):
    register(client)

    wrong_pw = login(client, password="wrong-password")
    unknown = login(client, email="nobody@example.com")

    assert wrong_pw.status_code == unknown.status_code == 401
    assert wrong_pw.json() == unknown.json()
