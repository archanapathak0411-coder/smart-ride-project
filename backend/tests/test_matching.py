"""Lock the Sector 15 / Sector 16 example from the project brief."""

from datetime import date, time

from app.matching.recommend import recommend
from app.matching.score import score_ride
from app.matching.types import MatchRide, SearchQuery
from app.matching.weights import (
    COST,
    DROP,
    PAST,
    PICKUP,
    RATING,
    SEATS,
    TIME,
)

CAMPUS = (28.36747, 77.31589)
SECTOR_15 = (28.39680, 77.31620)
SECTOR_16 = (28.40240, 77.32010)
BADARPUR = (28.49350, 77.30300)
BALLABHGARH = (28.33940, 77.31960)
RIDE_DATE = date(2026, 9, 29)


def _query(women_only=False, passenger_id=1, minutes=8 * 60 + 30):
    return SearchQuery(
        passenger_id=passenger_id,
        pickup_lat=SECTOR_15[0],
        pickup_lng=SECTOR_15[1],
        drop_lat=CAMPUS[0],
        drop_lng=CAMPUS[1],
        ride_date=RIDE_DATE,
        time_minutes=minutes,
        women_only=women_only,
        max_cost=None,
    )


def _ride(
    ride_id,
    driver_id,
    pickup,
    drop,
    clock,
    cost=40,
    seats=3,
    women_only=False,
    status="open",
    rating=None,
    rating_count=0,
    past=False,
):
    return MatchRide(
        ride_id=ride_id,
        driver_id=driver_id,
        pickup_lat=pickup[0],
        pickup_lng=pickup[1],
        drop_lat=drop[0],
        drop_lng=drop[1],
        ride_date=RIDE_DATE,
        ride_time=clock,
        cost=cost,
        seats_available=seats,
        women_only=women_only,
        status=status,
        driver_rating=rating,
        rating_count=rating_count,
        had_past_ride=past,
    )


def test_weights_add_up_to_one():
    total = PICKUP + DROP + TIME + COST + RATING + SEATS + PAST
    assert abs(total - 1.0) < 0.0001


def test_nearby_morning_ride_scores_higher_than_a_far_ride():
    close = _ride(10, 2, SECTOR_16, CAMPUS, time(8, 31))
    far = _ride(11, 3, BADARPUR, BALLABHGARH, time(18, 0), cost=180, seats=1)
    query = _query()

    close_score = score_ride(query, close)["phase1_score"]
    far_score = score_ride(query, far)["phase1_score"]
    assert close_score > 70
    assert close_score > far_score

    result = recommend(query, [far, close])
    assert result["knn_used"] is True
    assert result["matches"][0]["ride_id"] == 10
    assert result["matches"][0]["score"] >= result["matches"][1]["score"]
    assert any("minute" in reason for reason in result["matches"][0]["reasons"])


def test_one_ride_skips_knn():
    only = _ride(10, 2, SECTOR_16, CAMPUS, time(8, 31))
    result = recommend(_query(), [only])
    assert result["knn_used"] is False
    assert result["matches"][0]["score"] == result["matches"][0]["phase1_score"]


def test_women_only_rides_stay_separate():
    normal = _ride(10, 2, SECTOR_16, CAMPUS, time(8, 31))
    women = _ride(12, 4, SECTOR_16, CAMPUS, time(8, 32), women_only=True)
    hidden = recommend(_query(women_only=False), [normal, women])
    only_women = recommend(_query(women_only=True), [normal, women])
    assert [item["ride_id"] for item in hidden["matches"]] == [10]
    assert [item["ride_id"] for item in only_women["matches"]] == [12]


def test_own_ride_and_wrong_date_are_removed():
    own = _ride(10, 1, SECTOR_16, CAMPUS, time(8, 31))
    other_day = _ride(11, 2, SECTOR_16, CAMPUS, time(8, 31))
    other_day.ride_date = date(2026, 9, 30)
    result = recommend(_query(passenger_id=1), [own, other_day])
    assert result["matches"] == []
