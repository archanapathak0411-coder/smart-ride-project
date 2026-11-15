from flask import Blueprint, jsonify
from app.auth_tokens import jwt_required

from app.http import json_body
from app.services import admin_service
from app.services.guards import current_user

bp = Blueprint("admin", __name__)


@bp.get("/students")
@jwt_required()
def students():
    return jsonify({"students": admin_service.list_students(current_user())})


@bp.post("/students/<int:user_id>/verify")
@jwt_required()
def verify(user_id):
    student = admin_service.set_verification(current_user(), user_id, "verified")
    return jsonify({"student": student})


@bp.post("/students/<int:user_id>/reject")
@jwt_required()
def reject(user_id):
    student = admin_service.set_verification(current_user(), user_id, "rejected")
    return jsonify({"student": student})


@bp.delete("/students/<int:user_id>")
@jwt_required()
def delete_student(user_id):
    result = admin_service.delete_student(current_user(), user_id)
    return jsonify(result)


@bp.post("/students/<int:user_id>/photo")
@jwt_required()
def upload_student_photo(user_id):
    body = json_body()
    photo = body.get("id_card_photo") or ""
    student = admin_service.upload_student_photo(current_user(), user_id, photo)
    return jsonify({"student": student})


@bp.get("/rides")
@jwt_required()
def rides():
    return jsonify({"rides": admin_service.list_rides(current_user())})


@bp.get("/bookings")
@jwt_required()
def bookings():
    return jsonify({"bookings": admin_service.list_bookings(current_user())})


@bp.post("/rides/<int:ride_id>/cancel")
@jwt_required()
def cancel_ride(ride_id):
    ride = admin_service.admin_cancel_ride(current_user(), ride_id)
    return jsonify({"ride": ride})
