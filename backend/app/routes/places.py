from flask import Blueprint, jsonify

from app.models import Place

bp = Blueprint("places", __name__)


@bp.get("")
def list_places():
    places = Place.query.order_by(Place.name).all()
    return jsonify({"places": [place.to_dict() for place in places]})
