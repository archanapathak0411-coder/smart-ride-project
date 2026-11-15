from flask import Blueprint, jsonify, request
from app.auth_tokens import jwt_required

from app.http import json_body
from app.services import ride_service
from app.services.guards import current_user

bp = Blueprint("rides", __name__)


@bp.post("")
@jwt_required()
def create_ride():
    ride = ride_service.create_ride(current_user(), json_body())
    return jsonify({"ride": ride}), 201


@bp.post("/search")
@jwt_required()
def search():
    result = ride_service.search_rides(current_user(), json_body())
    return jsonify(result)


@bp.get("/mine")
@jwt_required()
def mine():
    return jsonify({"rides": ride_service.list_my_rides(current_user())})


@bp.post("/calculate-fare")
def calculate_fare_post():
    return jsonify(ride_service.calculate_fare(json_body()))


@bp.get("/calculate-fare")
def calculate_fare_get():
    return jsonify(ride_service.calculate_fare(request.args.to_dict()))


@bp.get("/<int:ride_id>")
def get_ride_details(ride_id):
    ride = ride_service._get_ride(ride_id)
    return jsonify({"ride": ride_service._public_ride(ride)})


@bp.patch("/<int:ride_id>")
@jwt_required()
def update_ride(ride_id):
    ride = ride_service.update_ride(current_user(), ride_id, json_body())
    return jsonify({"ride": ride})


@bp.post("/<int:ride_id>/cancel")
@jwt_required()
def cancel(ride_id):
    ride = ride_service.cancel_ride(current_user(), ride_id)
    return jsonify({"ride": ride})


@bp.post("/<int:ride_id>/complete")
@jwt_required()
def complete(ride_id):
    ride = ride_service.complete_ride(current_user(), ride_id)
    return jsonify({"ride": ride})
