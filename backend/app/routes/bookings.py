from flask import Blueprint, jsonify
from app.auth_tokens import jwt_required

from app.http import json_body
from app.services import booking_service
from app.services.guards import current_user

bp = Blueprint("bookings", __name__)


@bp.post("")
@jwt_required()
def create_booking():
    booking = booking_service.request_booking(current_user(), json_body())
    return jsonify({"booking": booking}), 201


@bp.get("/mine")
@jwt_required()
def mine():
    return jsonify({"bookings": booking_service.list_my_bookings(current_user())})


@bp.post("/<int:booking_id>/accept")
@jwt_required()
def accept(booking_id):
    booking = booking_service.accept_booking(current_user(), booking_id)
    return jsonify({"booking": booking})


@bp.post("/<int:booking_id>/reject")
@jwt_required()
def reject(booking_id):
    booking = booking_service.reject_booking(current_user(), booking_id)
    return jsonify({"booking": booking})


@bp.post("/<int:booking_id>/cancel")
@jwt_required()
def cancel(booking_id):
    booking = booking_service.cancel_booking(current_user(), booking_id)
    return jsonify({"booking": booking})
