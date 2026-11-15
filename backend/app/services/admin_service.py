"""Admin actions: verify students and watch rides."""

from app.errors import ApiError
from app.extensions import db
from app.models import Booking, Rating, Ride, User
from app.services.guards import require_admin
from app.services.ride_service import cancel_ride


def list_students(admin):
    require_admin(admin)
    rows = User.query.filter_by(role="student").order_by(User.created_at.desc()).all()
    return [row.to_dict() for row in rows]


def set_verification(admin, user_id, status):
    require_admin(admin)
    if status not in ("verified", "rejected", "pending"):
        raise ApiError("Status must be verified, rejected, or pending")
    student = db.session.get(User, user_id)
    if student is None or student.role != "student":
        raise ApiError("Student not found", 404)
    student.verification_status = status
    db.session.commit()
    return student.to_dict()


def delete_student(admin, user_id):
    require_admin(admin)
    student = db.session.get(User, user_id)
    if student is None or student.role != "student":
        raise ApiError("Student not found", 404)

    # Clean up student's bookings as passenger
    student_bookings = Booking.query.filter_by(passenger_id=user_id).all()
    for b in student_bookings:
        # If any ratings exist for this booking
        Rating.query.filter_by(booking_id=b.id).delete()
        db.session.delete(b)

    # Clean up student's rides as driver
    driver_rides = Ride.query.filter_by(driver_id=user_id).all()
    for r in driver_rides:
        ride_bookings = Booking.query.filter_by(ride_id=r.id).all()
        for rb in ride_bookings:
            Rating.query.filter_by(booking_id=rb.id).delete()
            db.session.delete(rb)
        db.session.delete(r)

    # Clean up any remaining ratings from this user
    Rating.query.filter_by(rater_id=user_id).delete()

    db.session.delete(student)
    db.session.commit()
    return {"message": "Student deleted successfully", "id": user_id}


def upload_student_photo(admin, user_id, photo_data):
    require_admin(admin)
    student = db.session.get(User, user_id)
    if student is None or student.role != "student":
        raise ApiError("Student not found", 404)
    student.id_card_photo = photo_data
    db.session.commit()
    return student.to_dict()


def list_rides(admin):
    require_admin(admin)
    rows = Ride.query.order_by(Ride.ride_date.desc(), Ride.ride_time.desc()).all()
    # Reuse the driver view builder one ride at a time would hide other drivers.
    payload = []
    for ride in rows:
        item = ride.to_dict()
        item["bookings"] = [
            {"id": booking.id, "status": booking.status, "passenger_name": booking.passenger.name}
            for booking in ride.bookings
        ]
        payload.append(item)
    return payload


def list_bookings(admin):
    require_admin(admin)
    rows = Booking.query.order_by(Booking.created_at.desc()).all()
    return [
        {
            "id": booking.id,
            "status": booking.status,
            "passenger_name": booking.passenger.name,
            "driver_name": booking.ride.driver.name,
            "ride_date": booking.ride.ride_date.isoformat(),
            "ride_time": booking.ride.ride_time.strftime("%H:%M"),
            "pickup": booking.ride.pickup_name,
            "drop": booking.ride.drop_name,
        }
        for booking in rows
    ]


def admin_cancel_ride(admin, ride_id):
    require_admin(admin)
    return cancel_ride(admin, ride_id, allow_admin=True)
