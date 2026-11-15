"""Create, search, cancel and complete rides."""

from datetime import datetime, time

from app.clock import now_ist
from app.errors import ApiError
from app.extensions import db
from app.matching import recommend
from app.matching.geo import haversine_km
from app.matching.types import MatchRide, SearchQuery
from app.models import Booking, Place, Ride
from app.parsing import as_bool
from app.services.guards import require_verified_student
from app.services.rating_lookup import rating_map

ACTIVE_BOOKING = ("pending", "accepted")


def create_ride(user, data):
    require_verified_student(user)
    pickup = _place(data.get("pickup_place_id"), "pickup")
    drop = _place(data.get("drop_place_id"), "drop")
    if pickup.id == drop.id:
        raise ApiError("Pickup and drop must be different places")

    ride_date = _date(data.get("ride_date"))
    ride_time = _time(data.get("ride_time"))
    if ride_date < now_ist().date():
        raise ApiError("Ride date cannot be in the past")

    seats = _int(data.get("seats_total"), "Seats")
    if seats < 1 or seats > 6:
        raise ApiError("Seats must be from 1 to 6")
    cost = _number(data.get("cost_per_seat"), "Cost per seat")
    if cost < 0 or cost > 5000:
        raise ApiError("Cost per seat must be between 0 and 5000")

    ride = Ride(
        driver_id=user.id,
        pickup_name=pickup.name,
        pickup_lat=pickup.latitude,
        pickup_lng=pickup.longitude,
        drop_name=drop.name,
        drop_lat=drop.latitude,
        drop_lng=drop.longitude,
        ride_date=ride_date,
        ride_time=ride_time,
        seats_total=seats,
        seats_available=seats,
        cost_per_seat=cost,
        women_only=as_bool(data.get("women_only")),
        status="open",
    )
    db.session.add(ride)
    db.session.commit()
    return _public_ride(ride)


def update_ride(user, ride_id, data):
    require_verified_student(user)
    ride = _get_ride(ride_id)
    if ride.driver_id != user.id and user.role != "admin":
        raise ApiError("Only the driver can edit this ride", 403)
    if ride.status in ("completed", "cancelled"):
        raise ApiError("Cannot edit a completed or cancelled ride")

    if "seats_total" in data and data["seats_total"] is not None:
        new_total = _int(data["seats_total"], "Seats")
        booked_seats = ride.seats_total - ride.seats_available
        if new_total < booked_seats:
            raise ApiError(f"Cannot reduce seats below already booked seats ({booked_seats})")
        ride.seats_available = new_total - booked_seats
        ride.seats_total = new_total
        if ride.seats_available > 0 and ride.status == "full":
            ride.status = "open"
        elif ride.seats_available == 0 and ride.status == "open":
            ride.status = "full"

    if "cost_per_seat" in data and data["cost_per_seat"] is not None:
        cost = _number(data["cost_per_seat"], "Cost per seat")
        if cost < 0 or cost > 5000:
            raise ApiError("Cost per seat must be between 0 and 5000")
        ride.cost_per_seat = cost

    if "ride_time" in data and data["ride_time"]:
        ride.ride_time = _time(data["ride_time"])

    if "women_only" in data and data["women_only"] is not None:
        ride.women_only = as_bool(data["women_only"])

    db.session.commit()
    return _public_ride(ride)


def calculate_fare(data):
    pickup = _point(data, "pickup")
    drop = _point(data, "drop")
    straight_dist_km = haversine_km(pickup[0], pickup[1], drop[0], drop[1])
    # Road routing estimation (typically ~1.25x haversine)
    road_dist_km = max(1.5, round(straight_dist_km * 1.25, 1))

    # Recommended student carpool fare: ₹15 base + ₹5.50/km
    base_fare = 15.0
    rate_per_km = 5.5
    raw_fare = base_fare + (road_dist_km * rate_per_km)
    recommended = int(round(raw_fare / 5.0) * 5)  # round to multiple of 5
    recommended = max(20, recommended)

    min_fare = max(15, int(round((recommended * 0.75) / 5.0) * 5))
    max_fare = int(round((recommended * 1.35) / 5.0) * 5)

    # Solo Auto & Cab comparison
    solo_auto = int(round(30 + road_dist_km * 14))
    solo_cab = int(round(60 + road_dist_km * 22))
    savings_vs_auto = max(0, solo_auto - recommended)
    savings_vs_cab = max(0, solo_cab - recommended)

    # Approximate duration (avg 25 km/h campus city traffic)
    duration_mins = max(5, int(round((road_dist_km / 25.0) * 60)))

    return {
        "straight_distance_km": round(straight_dist_km, 2),
        "road_distance_km": road_dist_km,
        "recommended_fare": recommended,
        "fare_range": {"min": min_fare, "max": max_fare},
        "solo_auto_fare": solo_auto,
        "solo_cab_fare": solo_cab,
        "savings_vs_auto": savings_vs_auto,
        "savings_vs_cab": savings_vs_cab,
        "estimated_duration_mins": duration_mins,
    }


def search_rides(user, data):
    pickup = _point(data, "pickup")
    drop = _point(data, "drop")
    ride_date = _date(data.get("ride_date"))
    ride_time = _time(data.get("ride_time"))
    women_only = as_bool(data.get("women_only"))
    max_cost = data.get("max_cost")
    if max_cost in ("", None):
        max_cost = None
    else:
        max_cost = _number(max_cost, "Maximum cost")
        if max_cost < 0:
            raise ApiError("Maximum cost cannot be negative")

    rows = (
        Ride.query.filter(
            Ride.ride_date == ride_date,
            Ride.status == "open",
            Ride.seats_available > 0,
        )
        .order_by(Ride.ride_time)
        .all()
    )
    ratings = rating_map({row.driver_id for row in rows})
    past_driver_ids = _past_driver_ids(user.id)
    history = _history_rides(user.id, ratings, past_driver_ids)

    match_rides = [
        _match_ride(row, ratings, past_driver_ids) for row in rows
    ]
    query = SearchQuery(
        passenger_id=user.id,
        pickup_lat=pickup[0],
        pickup_lng=pickup[1],
        drop_lat=drop[0],
        drop_lng=drop[1],
        ride_date=ride_date,
        time_minutes=ride_time.hour * 60 + ride_time.minute,
        women_only=women_only,
        max_cost=max_cost,
    )
    result = recommend(query, match_rides, history)
    by_id = {row.id: row for row in rows}
    matches = []
    for item in result["matches"]:
        ride = by_id[item["ride_id"]]
        average, count = ratings.get(ride.driver_id, (None, 0))
        matches.append(
            {
                "score": item["score"],
                "phase1_score": item["phase1_score"],
                "knn_closeness": item["knn_closeness"],
                "reasons": item["reasons"],
                "ride": ride.to_dict(average, count),
            }
        )
    return {"knn_used": result["knn_used"], "matches": matches}


def list_my_rides(user):
    rows = (
        Ride.query.filter_by(driver_id=user.id)
        .order_by(Ride.ride_date.desc(), Ride.ride_time.desc())
        .all()
    )
    ratings = rating_map({user.id})
    average, count = ratings.get(user.id, (None, 0))
    rides = []
    for ride in rows:
        payload = ride.to_dict(average, count)
        payload["bookings"] = [
            {
                "id": booking.id,
                "status": booking.status,
                "passenger": {
                    "id": booking.passenger.id,
                    "name": booking.passenger.name,
                    "phone": booking.passenger.phone,
                    "student_id": booking.passenger.student_id,
                    "branch": booking.passenger.branch or "Computer Engineering",
                    "verification_status": booking.passenger.verification_status,
                },
            }
            for booking in ride.bookings
        ]
        rides.append(payload)
    return rides


def cancel_ride(user, ride_id, allow_admin=False):
    ride = _get_ride(ride_id)
    is_driver = ride.driver_id == user.id
    is_admin = allow_admin and user.role == "admin"
    if not is_driver and not is_admin:
        raise ApiError("Only the driver can cancel this ride", 403)
    if ride.status in ("completed", "cancelled"):
        raise ApiError("This ride is already finished")
    ride.status = "cancelled"
    for booking in ride.bookings:
        if booking.status in ACTIVE_BOOKING:
            booking.status = "cancelled"
    db.session.commit()
    return _public_ride(ride)


def complete_ride(user, ride_id):
    require_verified_student(user)
    ride = _get_ride(ride_id)
    if ride.driver_id != user.id:
        raise ApiError("Only the driver can complete this ride", 403)
    if ride.status not in ("open", "full"):
        raise ApiError("This ride cannot be marked completed")
    departure = datetime.combine(ride.ride_date, ride.ride_time)
    if departure > now_ist():
        raise ApiError("You can mark the ride completed after its departure time")
    ride.status = "completed"
    for booking in ride.bookings:
        if booking.status == "accepted":
            booking.status = "completed"
        elif booking.status == "pending":
            booking.status = "rejected"
    db.session.commit()
    return _public_ride(ride)


def lock_ride(ride_id):
    query = db.session.query(Ride).filter_by(id=ride_id)
    if db.engine.dialect.name != "sqlite":
        query = query.with_for_update()
    ride = query.one_or_none()
    if ride is None:
        raise ApiError("Ride not found", 404)
    return ride


def _public_ride(ride):
    ratings = rating_map({ride.driver_id})
    average, count = ratings.get(ride.driver_id, (None, 0))
    return ride.to_dict(average, count)


def _get_ride(ride_id):
    ride = db.session.get(Ride, ride_id)
    if ride is None:
        raise ApiError("Ride not found", 404)
    return ride


def _place(place_id, label):
    try:
        place_id = int(place_id)
    except (TypeError, ValueError):
        raise ApiError("Choose a " + label + " place")
    place = db.session.get(Place, place_id)
    if place is None:
        raise ApiError("Choose a " + label + " place")
    return place


def _point(data, label):
    place_key = label + "_place_id"
    if data.get(place_key) not in (None, ""):
        place = _place(data.get(place_key), label)
        return place.latitude, place.longitude
    try:
        lat = float(data.get(label + "_lat"))
        lng = float(data.get(label + "_lng"))
    except (TypeError, ValueError):
        raise ApiError("Choose a " + label + " place")
    return lat, lng


def _date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise ApiError("Date must look like YYYY-MM-DD")


def _time(value):
    for pattern in ("%H:%M", "%H:%M:%S"):
        try:
            parsed = datetime.strptime(value, pattern)
            return time(parsed.hour, parsed.minute)
        except (TypeError, ValueError):
            continue
    raise ApiError("Time must look like HH:MM")


def _int(value, label):
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ApiError(label + " must be a whole number")


def _number(value, label):
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ApiError(label + " must be a number")


def _past_driver_ids(passenger_id):
    rows = (
        Booking.query.join(Ride)
        .filter(Booking.passenger_id == passenger_id, Booking.status == "completed")
        .all()
    )
    return {row.ride.driver_id for row in rows}


def _history_rides(passenger_id, ratings, past_driver_ids):
    rows = (
        Booking.query.join(Ride)
        .filter(Booking.passenger_id == passenger_id, Booking.status == "completed")
        .all()
    )
    history = []
    for booking in rows:
        extra_ratings = rating_map({booking.ride.driver_id})
        ratings.update(extra_ratings)
        history.append(_match_ride(booking.ride, ratings, past_driver_ids))
    return history


def _match_ride(row, ratings, past_driver_ids):
    average, count = ratings.get(row.driver_id, (None, 0))
    return MatchRide(
        ride_id=row.id,
        driver_id=row.driver_id,
        pickup_lat=row.pickup_lat,
        pickup_lng=row.pickup_lng,
        drop_lat=row.drop_lat,
        drop_lng=row.drop_lng,
        ride_date=row.ride_date,
        ride_time=row.ride_time,
        cost=float(row.cost_per_seat),
        seats_available=row.seats_available,
        women_only=bool(row.women_only),
        status=row.status,
        driver_rating=average,
        rating_count=count,
        had_past_ride=row.driver_id in past_driver_ids,
    )
