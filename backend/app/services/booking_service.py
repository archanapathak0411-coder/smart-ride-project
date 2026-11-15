"""Request, accept, reject and cancel a seat."""

from app.errors import ApiError
from app.extensions import db
from app.models import Booking
from app.parsing import as_bool
from app.services.guards import require_verified_student
from app.services.rating_lookup import ratings_by_user_for_bookings
from app.services.ride_service import _public_ride, lock_ride

OPEN_REQUEST = ("pending", "accepted")


def request_booking(user, data):
    require_verified_student(user)
    try:
        ride_id = int(data.get("ride_id"))
    except (TypeError, ValueError):
        raise ApiError("Choose a ride to join")

    ride = lock_ride(ride_id)
    if ride.driver_id == user.id:
        raise ApiError("You cannot book your own ride")
    if ride.status != "open" or ride.seats_available < 1:
        raise ApiError("This ride has no open seats")
    opted_in = bool(user.women_only_preference) or as_bool(data.get("women_only"))
    if ride.women_only and not opted_in:
        raise ApiError(
            "This is a women-only ride. Tick women-only on the search form to join it."
        )

    existing = Booking.query.filter(
        Booking.ride_id == ride.id,
        Booking.passenger_id == user.id,
        Booking.status.in_(OPEN_REQUEST),
    ).first()
    if existing is not None:
        raise ApiError("You already have a request for this ride", 409)

    booking = Booking(ride_id=ride.id, passenger_id=user.id, status="pending")
    db.session.add(booking)
    db.session.commit()
    return booking_to_dict(booking, user)


def accept_booking(driver, booking_id):
    require_verified_student(driver)
    booking = _get_booking(booking_id)
    ride = lock_ride(booking.ride_id)
    if ride.driver_id != driver.id:
        raise ApiError("Only the driver can accept this request", 403)
    if booking.status != "pending":
        raise ApiError("This request is not waiting for a decision")
    if ride.status != "open" or ride.seats_available < 1:
        raise ApiError("No seats left")

    ride.seats_available -= 1
    if ride.seats_available == 0:
        ride.status = "full"
    booking.status = "accepted"
    db.session.commit()
    return booking_to_dict(booking, driver)


def reject_booking(driver, booking_id):
    require_verified_student(driver)
    booking = _get_booking(booking_id)
    ride = lock_ride(booking.ride_id)
    if ride.driver_id != driver.id:
        raise ApiError("Only the driver can reject this request", 403)
    if booking.status != "pending":
        raise ApiError("This request is not waiting for a decision")
    booking.status = "rejected"
    db.session.commit()
    return booking_to_dict(booking, driver)


def cancel_booking(user, booking_id):
    booking = _get_booking(booking_id)
    ride = lock_ride(booking.ride_id)
    is_passenger = booking.passenger_id == user.id
    is_driver = ride.driver_id == user.id
    if not is_passenger and not is_driver:
        raise ApiError("You cannot cancel this request", 403)
    if booking.status not in OPEN_REQUEST:
        raise ApiError("This request cannot be cancelled")
    if ride.status in ("completed", "cancelled"):
        raise ApiError("This ride is already finished")

    if booking.status == "accepted" and ride.status in ("open", "full"):
        ride.seats_available += 1
        if ride.status == "full":
            ride.status = "open"
    booking.status = "cancelled"
    db.session.commit()
    return booking_to_dict(booking, user)


def list_my_bookings(user):
    rows = (
        Booking.query.filter_by(passenger_id=user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    given = ratings_by_user_for_bookings(user.id, [row.id for row in rows])
    return [booking_to_dict(row, user, given.get(row.id)) for row in rows]


def booking_to_dict(booking, viewer, my_rating=None):
    if my_rating is None:
        found = ratings_by_user_for_bookings(viewer.id, [booking.id])
        my_rating = found.get(booking.id)
    can_rate = booking.status == "completed" and my_rating is None
    return {
        "id": booking.id,
        "status": booking.status,
        "can_rate": can_rate,
        "my_rating": None if my_rating is None else my_rating.stars,
        "passenger": {
            "id": booking.passenger.id,
            "name": booking.passenger.name,
            "phone": booking.passenger.phone,
            "student_id": booking.passenger.student_id,
            "branch": booking.passenger.branch or "Computer Engineering",
        },
        "ride": _public_ride(booking.ride),
    }


def _get_booking(booking_id):
    booking = db.session.get(Booking, booking_id)
    if booking is None:
        raise ApiError("Booking not found", 404)
    return booking
