"""Read the JSON body of a request."""

from flask import request

from app.errors import ApiError


def json_body():
    data = request.get_json(silent=True)
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise ApiError("Send JSON data")
    return data
