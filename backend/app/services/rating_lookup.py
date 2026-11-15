"""Read ratings without scattering the same query through every service."""

from sqlalchemy import func

from app.models import Rating


def rating_map(user_ids):
    """Average stars received by each user id."""
    if not user_ids:
        return {}
    rows = (
        Rating.query.with_entities(
            Rating.ratee_id,
            func.avg(Rating.stars),
            func.count(Rating.id),
        )
        .filter(Rating.ratee_id.in_(list(user_ids)))
        .group_by(Rating.ratee_id)
        .all()
    )
    result = {}
    for user_id, average, count in rows:
        result[user_id] = (float(average), int(count))
    return result


def ratings_by_user_for_bookings(user_id, booking_ids):
    if not booking_ids:
        return {}
    rows = Rating.query.filter(
        Rating.rater_id == user_id,
        Rating.booking_id.in_(list(booking_ids)),
    ).all()
    return {row.booking_id: row for row in rows}
