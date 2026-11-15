"""Small helpers shared by the score and the KNN model."""

import math


def haversine_km(lat1, lng1, lat2, lng2):
    """Straight-line distance in kilometres between two map points."""
    earth_km = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lng / 2) ** 2
    )
    return 2 * earth_km * math.asin(math.sqrt(a))


def to_minutes(value):
    """Accept a datetime.time or a minute count."""
    if isinstance(value, int):
        return value
    return value.hour * 60 + value.minute


def closeness(distance, zero_at):
    """1 when distance is 0, and 0 when distance reaches zero_at."""
    if zero_at <= 0:
        return 0.0
    return max(0.0, 1.0 - (distance / zero_at))
