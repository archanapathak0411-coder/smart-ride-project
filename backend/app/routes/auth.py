from flask import Blueprint, jsonify
from app.auth_tokens import create_access_token, jwt_required

from app.http import json_body
from app.services import auth_service
from app.services.guards import current_user

bp = Blueprint("auth", __name__)


@bp.post("/register")
def register():
    user = auth_service.register(json_body())
    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()}), 201


@bp.post("/login")
def login():
    user = auth_service.login(json_body())
    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()})


@bp.get("/me")
@jwt_required()
def me():
    return jsonify({"user": current_user().to_dict()})


@bp.patch("/me")
@jwt_required()
def update_me():
    user = auth_service.update_profile(current_user(), json_body())
    return jsonify({"user": user.to_dict()})


@bp.post("/verify-status")
def check_status():
    body = json_body()
    identifier = body.get("identifier") or body.get("student_id") or body.get("email") or ""
    status_info = auth_service.get_verification_status(identifier)
    return jsonify({"student": status_info})


@bp.post("/upload-id")
def upload_id():
    body = json_body()
    identifier = body.get("identifier") or body.get("student_id") or body.get("email") or ""
    photo = body.get("id_card_photo") or ""
    user = auth_service.upload_verification_photo(identifier, photo)
    return jsonify({"user": user, "message": "ID Card photo uploaded successfully. Verification is pending."})
