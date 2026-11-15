"""Change these numbers to retune matching. They must add up to 1."""

PICKUP = 0.25
DROP = 0.25
TIME = 0.20
COST = 0.10
RATING = 0.10
SEATS = 0.05
PAST = 0.05

PHASE1_BLEND = 0.60
KNN_BLEND = 0.40

# A pickup or drop this many kilometres away scores 0.
PICKUP_ZERO_KM = 5.0
DROP_ZERO_KM = 5.0
# A time gap this many minutes scores 0.
TIME_ZERO_MINUTES = 60
# Used when the passenger did not type a maximum share amount.
DEFAULT_COST_REFERENCE = 150.0
# New drivers have no stars yet. Treat them as a middle rating.
NEUTRAL_RATING = 3.5
# How many open rides are required before KNN is used.
MIN_RIDES_FOR_KNN = 2
