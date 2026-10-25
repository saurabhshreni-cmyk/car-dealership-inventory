import pytest


@pytest.fixture
def fleet(stock):
    return [
        stock("Toyota", "Camry", "Sedan", 25000, 3),
        stock("Toyota", "RAV4", "SUV", 32000, 0),
        stock("Honda", "Civic", "Sedan", 22000, 5),
        stock("Ford", "F-150", "Truck", 45000, 2),
    ]


def names(response):
    return [v["model"] for v in response.json()]


def test_list_requires_authentication(client):
    assert client.get("/api/vehicles").status_code == 401


def test_list_returns_empty_array_when_no_vehicles(client, auth_headers):
    response = client.get("/api/vehicles", headers=auth_headers())

    assert response.status_code == 200
    assert response.json() == []


def test_list_returns_all_vehicles_ordered_by_id(client, auth_headers, fleet):
    response = client.get("/api/vehicles", headers=auth_headers())

    assert names(response) == ["Camry", "RAV4", "Civic", "F-150"]
    assert response.json()[0]["price"] == 25000


def test_search_requires_authentication(client):
    assert client.get("/api/vehicles/search").status_code == 401


def test_search_without_filters_returns_everything(client, auth_headers, fleet):
    assert len(client.get("/api/vehicles/search", headers=auth_headers()).json()) == 4


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"make": "toy"}, ["Camry", "RAV4"]),
        ({"make": "HONDA"}, ["Civic"]),
        ({"model": "cam"}, ["Camry"]),
        ({"category": "sedan"}, ["Camry", "Civic"]),
        ({"min_price": 30000}, ["RAV4", "F-150"]),
        ({"max_price": 25000}, ["Camry", "Civic"]),
        ({"min_price": 23000, "max_price": 33000}, ["Camry", "RAV4"]),
        ({"make": "toyota", "category": "suv"}, ["RAV4"]),
        ({"make": "tesla"}, []),
    ],
)
def test_search_filters(client, auth_headers, fleet, params, expected):
    response = client.get("/api/vehicles/search", params=params, headers=auth_headers())

    assert response.status_code == 200
    assert names(response) == expected


def test_search_rejects_inverted_price_range(client, auth_headers):
    response = client.get(
        "/api/vehicles/search", params={"min_price": 50, "max_price": 10}, headers=auth_headers()
    )

    assert response.status_code == 422


@pytest.mark.parametrize("term", ["%", "_", "100%", "a\b"])
def test_search_treats_like_wildcards_literally(client, auth_headers, fleet, term):
    response = client.get("/api/vehicles/search", params={"model": term}, headers=auth_headers())

    assert response.status_code == 200
    assert names(response) == []


def test_search_finds_models_containing_wildcard_characters(client, auth_headers, stock):
    stock("Odd", "100%_Special")

    response = client.get("/api/vehicles/search", params={"model": "%_"}, headers=auth_headers())

    assert names(response) == ["100%_Special"]
