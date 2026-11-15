"""Combine hard filters, the phase-1 score, and the KNN rank."""

from app.matching.knn_matcher import knn_closeness
from app.matching.score import passes_hard_filters, score_ride
from app.matching.weights import KNN_BLEND, MIN_RIDES_FOR_KNN, PHASE1_BLEND


def recommend(query, rides, history_rides=None):
    """Return ranked matches and whether KNN was used.

    history_rides are completed trips. They are not offered again.
    """
    history_rides = history_rides or []
    allowed = [ride for ride in rides if passes_hard_filters(query, ride)]
    scored = []
    for ride in allowed:
        details = score_ride(query, ride)
        scored.append({"ride": ride, "details": details})

    knn_used = len(scored) >= MIN_RIDES_FOR_KNN
    closeness = {}
    if knn_used:
        closeness = knn_closeness(query, allowed, history_rides) or {}
        if not closeness:
            knn_used = False

    matches = []
    for item in scored:
        ride = item["ride"]
        phase1 = item["details"]["phase1_score"]
        if knn_used:
            knn_part = closeness.get(ride.ride_id, 0.0)
            blended = (PHASE1_BLEND * (phase1 / 100.0)) + (KNN_BLEND * knn_part)
            final_score = round(max(0.0, min(blended * 100.0, 100.0)), 1)
        else:
            knn_part = None
            final_score = phase1
        matches.append(
            {
                "ride_id": ride.ride_id,
                "score": final_score,
                "phase1_score": phase1,
                "knn_closeness": None if knn_part is None else round(knn_part, 3),
                "reasons": item["details"]["reasons"],
                "pickup_km": item["details"]["pickup_km"],
                "time_diff": item["details"]["time_diff"],
            }
        )

    matches.sort(key=lambda item: (-item["score"], item["time_diff"], item["pickup_km"]))
    return {"knn_used": knn_used, "matches": matches}
