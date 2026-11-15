"""The HTTP API used by the website and the phone app."""

from app.clock import now_ist
from tests.conftest import add_place, add_user, auth_header

CAMPUS = (28.36747, 77.31589)
SECTOR_15 = (28.39680, 77.31620)
SECTOR_16 = (28.40240, 77.32010)
BADARPUR = (28.49350, 77.30300)
BALLABHGARH = (28.33940, 77.31960)


def test_search_books_and_blocks_unverified_students(client, app):
    driver = add_user("Rahul", "driver@test.local", "YM10")
    other = add_user("Vikram", "vikram@test.local", "YM11")
    passenger = add_user("Ananya", "passenger@test.local", "YM12")
    admin = add_user("Admin", "admin@test.local", "ADMIN9", role="admin")
    campus = add_place("Campus", *CAMPUS)
    sector_15 = add_place("Sector 15", *SECTOR_15)
    sector_16 = add_place("Sector 16", *SECTOR_16)
    badarpur = add_place("Badarpur", *BADARPUR)
    ballabhgarh = add_place("Ballabhgarh", *BALLABHGARH)
    today = now_ist().date().isoformat()

    pending = client.post(
        "/api/auth/register",
        json={
            "name": "New Student",
            "email": "new@test.local",
            "phone": "9810099999",
            "password": "Student@123",
            "student_id": "YM1999",
        },
    )
    assert pending.status_code == 201
    assert pending.get_json()["user"]["verification_status"] == "pending"
    new_headers = {"Authorization": "Bearer " + pending.get_json()["access_token"]}
    blocked = client.post(
        "/api/rides",
        headers=new_headers,
        json={
            "pickup_place_id": sector_16.id,
            "drop_place_id": campus.id,
            "ride_date": today,
            "ride_time": "08:31",
            "seats_total": 2,
            "cost_per_seat": 40,
        },
    )
    assert blocked.status_code == 403

    driver_headers = auth_header(client, driver.email)
    other_headers = auth_header(client, other.email)
    passenger_headers = auth_header(client, passenger.email)
    admin_headers = auth_header(client, admin.email)

    near = client.post(
        "/api/rides",
        headers=driver_headers,
        json={
            "pickup_place_id": sector_16.id,
            "drop_place_id": campus.id,
            "ride_date": today,
            "ride_time": "08:31",
            "seats_total": 3,
            "cost_per_seat": 40,
        },
    )
    assert near.status_code == 201
    far = client.post(
        "/api/rides",
        headers=other_headers,
        json={
            "pickup_place_id": badarpur.id,
            "drop_place_id": ballabhgarh.id,
            "ride_date": today,
            "ride_time": "18:00",
            "seats_total": 2,
            "cost_per_seat": 180,
        },
    )
    assert far.status_code == 201

    found = client.post(
        "/api/rides/search",
        headers=passenger_headers,
        json={
            "pickup_place_id": sector_15.id,
            "drop_place_id": campus.id,
            "ride_date": today,
            "ride_time": "08:30",
            "women_only": False,
        },
    )
    assert found.status_code == 200
    payload = found.get_json()
    assert payload["knn_used"] is True
    assert payload["matches"][0]["ride"]["id"] == near.get_json()["ride"]["id"]
    assert payload["matches"][0]["score"] > payload["matches"][1]["score"]

    booked = client.post(
        "/api/bookings",
        headers=passenger_headers,
        json={"ride_id": near.get_json()["ride"]["id"]},
    )
    assert booked.status_code == 201
    accepted = client.post(
        "/api/bookings/%s/accept" % booked.get_json()["booking"]["id"],
        headers=driver_headers,
    )
    assert accepted.status_code == 200
    assert accepted.get_json()["booking"]["ride"]["seats_available"] == 2

    verified = client.post(
        "/api/admin/students/%s/verify" % pending.get_json()["user"]["id"],
        headers=admin_headers,
    )
    assert verified.status_code == 200
    assert verified.get_json()["student"]["verification_status"] == "verified"
