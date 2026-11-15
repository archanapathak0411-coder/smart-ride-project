"""Seat counts must stay correct when a request is accepted or cancelled."""

from datetime import time, timedelta

from app.clock import now_ist
from app.extensions import db
from app.models import Ride
from app.services import booking_service, rating_service, ride_service
from tests.conftest import add_place, add_user

CAMPUS = (28.36747, 77.31589)
SECTOR_16 = (28.40240, 77.32010)


def _setup():
    driver = add_user("Rahul", "rahul@test.local", "YM1")
    first = add_user("Ananya", "ananya@test.local", "YM2", solo_fare=120)
    second = add_user("Kabir", "kabir@test.local", "YM3")
    campus = add_place("Campus", *CAMPUS)
    sector = add_place("Sector 16", *SECTOR_16)
    ride = ride_service.create_ride(
        driver,
        {
            "pickup_place_id": sector.id,
            "drop_place_id": campus.id,
            "ride_date": now_ist().date().isoformat(),
            "ride_time": "23:50",
            "seats_total": 1,
            "cost_per_seat": 40,
            "women_only": False,
        },
    )
    return driver, first, second, ride


def test_accept_and_cancel_keep_the_seat_count(app):
    driver, first, second, ride = _setup()
    ride_id = ride["id"]

    first_booking = booking_service.request_booking(first, {"ride_id": ride_id})
    second_booking = booking_service.request_booking(second, {"ride_id": ride_id})
    assert db.session.get(Ride, ride_id).seats_available == 1

    booking_service.accept_booking(driver, first_booking["id"])
    saved = db.session.get(Ride, ride_id)
    assert saved.seats_available == 0
    assert saved.status == "full"

    try:
        booking_service.accept_booking(driver, second_booking["id"])
        raised = False
    except Exception as error:
        raised = True
        assert "No seats left" in str(error)
    assert raised is True
    assert db.session.get(Ride, ride_id).seats_available == 0

    booking_service.cancel_booking(first, first_booking["id"])
    restored = db.session.get(Ride, ride_id)
    assert restored.seats_available == 1
    assert restored.status == "open"

    booking_service.accept_booking(driver, second_booking["id"])
    assert db.session.get(Ride, ride_id).seats_available == 0


def test_complete_then_rate_and_savings(app):
    driver, passenger, _second, ride = _setup()
    booking = booking_service.request_booking(passenger, {"ride_id": ride["id"]})
    booking_service.accept_booking(driver, booking["id"])

    row = db.session.get(Ride, ride["id"])
    moment = now_ist()
    past = moment - timedelta(minutes=5)
    if past.month != moment.month:
        past = moment.replace(day=1, hour=0, minute=1, second=0, microsecond=0)
    row.ride_date = past.date()
    row.ride_time = time(past.hour, past.minute)
    db.session.commit()

    ride_service.complete_ride(driver, row.id)
    rating_service.create_rating(
        passenger, {"booking_id": booking["id"], "stars": 5, "comment": "On time"}
    )

    from app.services import savings_service

    report = savings_service.monthly_savings(passenger, None)
    assert report["trip_count"] == 1
    assert report["saved"] == 80
