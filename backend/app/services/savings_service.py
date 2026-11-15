"""Money saved by sharing rides in one calendar month."""

from datetime import datetime

from app.clock import now_ist
from app.errors import ApiError
from app.models import Booking, Ride


def monthly_savings(user, month_text):
    year, month = _month(month_text)
    start, end = _month_range(year, month)
    rows = (
        Booking.query.join(Ride)
        .filter(
            Booking.passenger_id == user.id,
            Booking.status == "completed",
            Ride.ride_date >= start,
            Ride.ride_date < end,
        )
        .order_by(Ride.ride_date, Ride.ride_time)
        .all()
    )
    solo = user.typical_solo_fare
    trips = []
    saved_total = 0.0
    spent_total = 0.0
    for booking in rows:
        cost = float(booking.ride.cost_per_seat)
        spent_total += cost
        saved = None
        if solo is not None:
            saved = max(0.0, float(solo) - cost)
            saved_total += saved
        trips.append(
            {
                "booking_id": booking.id,
                "ride_date": booking.ride.ride_date.isoformat(),
                "pickup": booking.ride.pickup_name,
                "drop": booking.ride.drop_name,
                "cost_per_seat": cost,
                "saved": saved,
            }
        )
    return {
        "month": "%04d-%02d" % (year, month),
        "trip_count": len(trips),
        "spent": round(spent_total, 2),
        "saved": None if solo is None else round(saved_total, 2),
        "typical_solo_fare": None if solo is None else float(solo),
        "trips": trips,
    }


def _month(month_text):
    if not month_text:
        today = now_ist()
        return today.year, today.month
    try:
        parsed = datetime.strptime(month_text, "%Y-%m")
    except (TypeError, ValueError):
        raise ApiError("Month must look like YYYY-MM")
    return parsed.year, parsed.month


def _month_range(year, month):
    start = datetime(year, month, 1).date()
    if month == 12:
        end = datetime(year + 1, 1, 1).date()
    else:
        end = datetime(year, month + 1, 1).date()
    return start, end
