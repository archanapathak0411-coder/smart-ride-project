"""Plain objects passed into the matcher.

The matcher does not import the database. Services build these objects
from Ride rows, and tests can build them by hand.
"""


class SearchQuery:
    def __init__(
        self,
        passenger_id,
        pickup_lat,
        pickup_lng,
        drop_lat,
        drop_lng,
        ride_date,
        time_minutes,
        women_only,
        max_cost,
    ):
        self.passenger_id = passenger_id
        self.pickup_lat = pickup_lat
        self.pickup_lng = pickup_lng
        self.drop_lat = drop_lat
        self.drop_lng = drop_lng
        self.ride_date = ride_date
        self.time_minutes = time_minutes
        self.women_only = women_only
        self.max_cost = max_cost


class MatchRide:
    def __init__(
        self,
        ride_id,
        driver_id,
        pickup_lat,
        pickup_lng,
        drop_lat,
        drop_lng,
        ride_date,
        ride_time,
        cost,
        seats_available,
        women_only,
        status,
        driver_rating,
        rating_count,
        had_past_ride,
    ):
        self.ride_id = ride_id
        self.driver_id = driver_id
        self.pickup_lat = pickup_lat
        self.pickup_lng = pickup_lng
        self.drop_lat = drop_lat
        self.drop_lng = drop_lng
        self.ride_date = ride_date
        self.ride_time = ride_time
        self.cost = float(cost)
        self.seats_available = seats_available
        self.women_only = women_only
        self.status = status
        self.driver_rating = driver_rating
        self.rating_count = rating_count
        self.had_past_ride = had_past_ride
