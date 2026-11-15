"""Phase 1: a weighted score from 0 to 100."""

from app.matching.geo import closeness, haversine_km, to_minutes
from app.matching.weights import (
    COST,
    DEFAULT_COST_REFERENCE,
    DROP,
    DROP_ZERO_KM,
    NEUTRAL_RATING,
    PAST,
    PICKUP,
    PICKUP_ZERO_KM,
    RATING,
    SEATS,
    TIME,
    TIME_ZERO_MINUTES,
)


def passes_hard_filters(query, ride):
    """True when a ride is allowed to be scored at all."""
    if ride.driver_id == query.passenger_id:
        return False
    if ride.status != "open":
        return False
    if ride.seats_available < 1:
        return False
    if ride.ride_date != query.ride_date:
        return False
    # Women-only rides and other rides stay in separate lists.
    if query.women_only and not ride.women_only:
        return False
    if ride.women_only and not query.women_only:
        return False
    return True


def score_ride(query, ride):
    """Return phase-1 score, the reasons shown on the card, and raw distances."""
    pickup_km = haversine_km(
        query.pickup_lat, query.pickup_lng, ride.pickup_lat, ride.pickup_lng
    )
    drop_km = haversine_km(
        query.drop_lat, query.drop_lng, ride.drop_lat, ride.drop_lng
    )
    time_diff = abs(to_minutes(ride.ride_time) - query.time_minutes)

    pickup_score = closeness(pickup_km, PICKUP_ZERO_KM)
    drop_score = closeness(drop_km, DROP_ZERO_KM)
    time_score = closeness(time_diff, TIME_ZERO_MINUTES)
    cost_score = _cost_score(ride.cost, query.max_cost)
    rating_value = ride.driver_rating if ride.driver_rating is not None else NEUTRAL_RATING
    rating_score = max(0.0, min(rating_value / 5.0, 1.0))
    seat_score = min(ride.seats_available, 4) / 4.0
    past_score = 1.0 if ride.had_past_ride else 0.0

    total = (
        PICKUP * pickup_score
        + DROP * drop_score
        + TIME * time_score
        + COST * cost_score
        + RATING * rating_score
        + SEATS * seat_score
        + PAST * past_score
    )
    phase1 = round(total * 100, 1)
    reasons = _reasons(pickup_km, drop_km, time_diff, ride, rating_value)
    return {
        "phase1_score": phase1,
        "reasons": reasons,
        "pickup_km": round(pickup_km, 2),
        "drop_km": round(drop_km, 2),
        "time_diff": time_diff,
    }


def _cost_score(cost, max_cost):
    reference = float(max_cost) if max_cost else DEFAULT_COST_REFERENCE
    if reference <= 0:
        return 1.0 if cost == 0 else 0.0
    return closeness(cost, reference)


def _reasons(pickup_km, drop_km, time_diff, ride, rating_value):
    reasons = []
    if pickup_km <= 2:
        reasons.append("Pickup is %.1f km from you" % pickup_km)
    elif pickup_km <= PICKUP_ZERO_KM:
        reasons.append("Pickup is %.1f km away" % pickup_km)
    if drop_km <= 1:
        reasons.append("Drop-off matches your destination")
    if time_diff == 0:
        reasons.append("Same departure time")
    elif time_diff <= 15:
        label = "minute" if time_diff == 1 else "minutes"
        reasons.append("%d %s apart" % (time_diff, label))
    reasons.append("Share amount Rs %d" % round(ride.cost))
    if ride.rating_count:
        reasons.append("Driver rating %.1f" % rating_value)
    if ride.had_past_ride:
        reasons.append("You completed a ride with this driver before")
    return reasons
