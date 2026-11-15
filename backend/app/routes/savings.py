from flask import Blueprint, jsonify, request
from app.auth_tokens import jwt_required

from app.services import savings_service
from app.services.guards import current_user

bp = Blueprint("savings", __name__)


@bp.get("")
@jwt_required()
def savings():
    report = savings_service.monthly_savings(current_user(), request.args.get("month"))
    return jsonify(report)
