from flask import Blueprint, jsonify
from app.auth_tokens import jwt_required

from app.http import json_body
from app.services import rating_service
from app.services.guards import current_user

bp = Blueprint("ratings", __name__)


@bp.post("")
@jwt_required()
def create_rating():
    rating = rating_service.create_rating(current_user(), json_body())
    return jsonify({"rating": rating}), 201
