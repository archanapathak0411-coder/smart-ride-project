"""Register, login, and profile updates."""

import re

from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from app.errors import ApiError
from app.extensions import db
from app.models import User
from app.parsing import as_bool

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_PATTERN = re.compile(r"^\d{10,15}$")


def register(data):
    name = _text(data, "name", 80)
    email = _text(data, "email", 120).lower()
    phone = _text(data, "phone", 15)
    password = data.get("password") or ""
    student_id = _text(data, "student_id", 30).upper()
    branch = (data.get("branch") or "Computer Engineering").strip()
    id_card_photo = data.get("id_card_photo") or None

    if len(name) < 2:
        raise ApiError("Please enter your full name")
    if not EMAIL_PATTERN.match(email):
        raise ApiError("Please enter a valid email")
    if not PHONE_PATTERN.match(phone):
        raise ApiError("Phone number should be 10 to 15 digits")
    if len(password) < 8:
        raise ApiError("Password must be at least 8 characters")
    if len(student_id) < 4:
        raise ApiError("Student ID looks too short")

    user = User(
        name=name,
        email=email,
        phone=phone,
        password_hash=generate_password_hash(password),
        student_id=student_id,
        role="student",
        verification_status="pending",
        branch=branch[:80],
        id_card_photo=id_card_photo,
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ApiError("This email or student ID is already registered", 409)
    return user


def login(data):
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter_by(email=email).first()
    if user is None or not check_password_hash(user.password_hash, password):
        raise ApiError("Email or password is incorrect", 401)
    return user


def update_profile(user, data):
    if "women_only_preference" in data:
        user.women_only_preference = as_bool(data.get("women_only_preference"))
    if "typical_solo_fare" in data:
        raw = data.get("typical_solo_fare")
        if raw is None or raw == "":
            user.typical_solo_fare = None
        else:
            fare = _number(raw, "Typical solo fare")
            if fare < 0 or fare > 10000:
                raise ApiError("Typical solo fare must be between 0 and 10000")
            user.typical_solo_fare = fare
    if "branch" in data and data["branch"]:
        user.branch = str(data["branch"]).strip()[:80]
    if "id_card_photo" in data:
        user.id_card_photo = data["id_card_photo"]
        # If user was rejected and re-uploads their ID card, reset status to pending
        if user.verification_status == "rejected" and data["id_card_photo"]:
            user.verification_status = "pending"
    db.session.commit()
    return user


def get_verification_status(identifier):
    clean = (identifier or "").strip()
    if not clean:
        raise ApiError("Enter email or Student ID to check verification status")
    user = (
        User.query.filter(
            (User.email == clean.lower()) | (User.student_id == clean.upper())
        ).first()
    )
    if user is None:
        raise ApiError("No student account found with this email or Student ID", 404)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "student_id": user.student_id,
        "branch": user.branch or "Computer Engineering",
        "verification_status": user.verification_status,
        "has_id_card": bool(user.id_card_photo),
        "id_card_photo": user.id_card_photo,
        "role": user.role,
    }


def upload_verification_photo(identifier, photo_data):
    clean = (identifier or "").strip()
    if not clean or not photo_data:
        raise ApiError("Student identifier and photo data are required")
    user = (
        User.query.filter(
            (User.email == clean.lower()) | (User.student_id == clean.upper())
        ).first()
    )
    if user is None:
        raise ApiError("Student account not found", 404)
    user.id_card_photo = photo_data
    if user.verification_status != "verified":
        user.verification_status = "pending"
    db.session.commit()
    return user.to_dict()


def _text(data, key, limit):
    value = data.get(key)
    if not isinstance(value, str):
        raise ApiError("Please fill in " + key.replace("_", " "))
    value = " ".join(value.split())
    if not value:
        raise ApiError("Please fill in " + key.replace("_", " "))
    return value[:limit]


def _number(raw, label):
    try:
        return float(raw)
    except (TypeError, ValueError):
        raise ApiError(label + " must be a number")
