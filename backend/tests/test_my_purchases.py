def test_my_purchases_requires_authentication(client):
    assert client.get("/api/purchases/me").status_code == 401


def test_my_purchases_is_empty_for_new_user(client, auth_headers):
    response = client.get("/api/purchases/me", headers=auth_headers("user"))

    assert response.status_code == 200
    assert response.json() == []


def test_my_purchases_lists_only_own_purchases_newest_first(client, auth_headers, stock):
    camry = stock("Toyota", "Camry", price=25000, quantity=5)
    civic = stock("Honda", "Civic", price=22000, quantity=5)
    alice = auth_headers("user", "alice@example.com")
    bob = auth_headers("user", "bob@example.com")
    client.post(f"/api/vehicles/{camry.id}/purchase", headers=alice)
    client.post(f"/api/vehicles/{civic.id}/purchase", headers=alice)
    client.post(f"/api/vehicles/{camry.id}/purchase", headers=bob)

    mine = client.get("/api/purchases/me", headers=alice).json()

    assert [p["model"] for p in mine] == ["Civic", "Camry"]
    assert mine[0]["price"] == 22000
    assert {"id", "vehicle_id", "make", "model", "price", "purchased_at"} <= mine[0].keys()
    assert len(client.get("/api/purchases/me", headers=bob).json()) == 1


def test_purchase_history_survives_vehicle_deletion(client, auth_headers, stock):
    vehicle = stock("Ford", "F-150", quantity=1)
    user = auth_headers("user")
    client.post(f"/api/vehicles/{vehicle.id}/purchase", headers=user)

    deleted = client.delete(f"/api/vehicles/{vehicle.id}", headers=auth_headers("admin"))
    history = client.get("/api/purchases/me", headers=user).json()

    assert deleted.status_code == 204
    assert [(p["make"], p["model"], p["vehicle_id"]) for p in history] == [("Ford", "F-150", None)]
