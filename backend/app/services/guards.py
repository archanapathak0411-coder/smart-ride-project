"""Shared checks used by more than one service."""

from app.auth_tokens import get_jwt_identity

from app.errors import ApiError
from app.extensions import db
from app.models import User


def current_user():
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        raise ApiError("Please log in again", 401)
    user = db.session.get(User, user_id)
    if user is None:
        raise ApiError("Account not found", 401)
    return user


def require_verified_student(user):
    # Allow both verified students and admins to perform ride actions
    if user.role not in ("student", "admin"):
        raise ApiError("Use a student or admin account for this action", 403)
    if user.role == "student" and user.verification_status != "verified":
        raise ApiError(
            "Your student ID is waiting for admin verification. Go to Admin Dashboard or Login Page to check status.",
            403,
        )
    return user


def require_admin(user):
    if user.role != "admin":
        raise ApiError("Admin access is required", 403)
    return user
