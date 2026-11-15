"""
Phase 1 and phase 2 ride matching.

Phase 1 turns pickup, drop, time, cost, seats, rating and past trips
into one score from 0 to 100. The weights live in weights.py.

Phase 2 asks scikit-learn for the rides closest to a perfect request.
The final order is 60 percent phase 1 and 40 percent that closeness.
"""

from app.matching.recommend import recommend

__all__ = ["recommend"]
