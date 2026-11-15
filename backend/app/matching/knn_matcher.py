"""Phase 2: rank rides with scikit-learn nearest neighbours.

Each ride becomes a row of numbers. The passenger request becomes the
ideal row (zero distance, zero time gap, low cost, high rating).
NearestNeighbors finds which ride rows sit closest to that ideal row.

Past completed trips are extra rows. They change the scale of the
numbers, so a student's history can nudge the ranking. They are not
shown as bookable rides.
"""

try:
    from sklearn.neighbors import NearestNeighbors
    from sklearn.preprocessing import StandardScaler
except ImportError:
    # Campus lab images do not ship scikit-learn. The stand-in below
    # implements the same two classes this file calls.
    from app.matching.simple_neighbors import NearestNeighbors, StandardScaler

from app.matching.geo import haversine_km, to_minutes
from app.matching.weights import NEUTRAL_RATING

# Lower numbers are better, so the ideal request is all zeros.
IDEAL = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]


def feature_row(query, ride):
    pickup_km = haversine_km(
        query.pickup_lat, query.pickup_lng, ride.pickup_lat, ride.pickup_lng
    )
    drop_km = haversine_km(
        query.drop_lat, query.drop_lng, ride.drop_lat, ride.drop_lng
    )
    time_diff = abs(to_minutes(ride.ride_time) - query.time_minutes)
    rating = ride.driver_rating if ride.driver_rating is not None else NEUTRAL_RATING
    past_gap = 0.0 if ride.had_past_ride else 1.0
    seat_gap = float(max(0, 4 - ride.seats_available))
    return [
        pickup_km,
        drop_km,
        float(time_diff),
        float(ride.cost),
        5.0 - rating,
        past_gap,
        seat_gap,
    ]


def knn_closeness(query, open_rides, history_rides):
    """Map each open ride id to a closeness from 0 to 1.

    Returns None when scikit-learn cannot fit a useful model.
    """
    rows = []
    open_indexes = []
    for ride in open_rides:
        open_indexes.append(len(rows))
        rows.append(feature_row(query, ride))
    for ride in history_rides:
        rows.append(feature_row(query, ride))

    scaler = StandardScaler()
    scaled = scaler.fit_transform(rows)
    query_scaled = scaler.transform([IDEAL])

    model = NearestNeighbors(n_neighbors=len(rows), algorithm="auto")
    model.fit(scaled)
    distances, indexes = model.kneighbors(query_scaled, n_neighbors=len(rows))

    distance_by_index = {}
    for distance, index in zip(distances[0], indexes[0]):
        distance_by_index[int(index)] = float(distance)

    open_distances = [distance_by_index[index] for index in open_indexes]
    similarities = [1.0 / (1.0 + distance) for distance in open_distances]
    low = min(similarities)
    high = max(similarities)

    closeness = {}
    for ride, similarity in zip(open_rides, similarities):
        if high == low:
            closeness[ride.ride_id] = 1.0
        else:
            closeness[ride.ride_id] = (similarity - low) / (high - low)
    return closeness
