"""Ratings after a completed trip."""

from app.errors import ApiError
from app.extensions import db
from app.models import Booking, Rating
from app.services.guards import require_verified_student


def create_rating(user, data):
    require_verified_student(user)
    try:
        booking_id = int(data.get("booking_id"))
        stars = int(data.get("stars"))
    except (TypeError, ValueError):
        raise ApiError("Choose a completed ride and a star rating")
    if stars < 1 or stars > 5:
        raise ApiError("Stars must be from 1 to 5")
    comment = data.get("comment") or ""
    if not isinstance(comment, str):
        raise ApiError("Comment must be text")
    comment = comment.strip()[:300]

    booking = db.session.get(Booking, booking_id)
    if booking is None:
        raise ApiError("Booking not found", 404)
    if booking.status != "completed":
        raise ApiError("You can rate a ride only after it is completed")

    ride = booking.ride
    if user.id == booking.passenger_id:
        ratee_id = ride.driver_id
    elif user.id == ride.driver_id:
        ratee_id = booking.passenger_id
    else:
        raise ApiError("You were not part of this ride", 403)

    existing = Rating.query.filter_by(booking_id=booking.id, rater_id=user.id).first()
    if existing is not None:
        raise ApiError("You already rated this ride", 409)

    rating = Rating(
        booking_id=booking.id,
        rater_id=user.id,
        ratee_id=ratee_id,
        stars=stars,
        comment=comment,
    )
    db.session.add(rating)
    db.session.commit()
    return rating.to_dict()
