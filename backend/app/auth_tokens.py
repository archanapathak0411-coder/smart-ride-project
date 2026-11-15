"""Login tokens.

Uses Flask-JWT-Extended when that package is installed. Otherwise this
file builds a normal HMAC-SHA256 JWT with the Python standard library.
Routes always call create_access_token, jwt_required and get_jwt_identity.
"""

try:
    from flask_jwt_extended import (  # noqa: F401
        JWTManager,
        create_access_token,
        get_jwt_identity,
        jwt_required,
    )
except ImportError:
    import base64
    import hashlib
    import hmac
    import json
    import time
    from functools import wraps

    from flask import current_app, g, jsonify, request

    class JWTManager:
        def __init__(self, app=None):
            self.unauthorized_callback = None
            self.invalid_callback = None
            self.expired_callback = None
            if app is not None:
                self.init_app(app)

        def init_app(self, app):
            app.extensions["jc_jwt"] = self

        def unauthorized_loader(self, callback):
            self.unauthorized_callback = callback
            return callback

        def invalid_token_loader(self, callback):
            self.invalid_callback = callback
            return callback

        def expired_token_loader(self, callback):
            self.expired_callback = callback
            return callback

    def create_access_token(identity):
        expires = current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
        payload = {
            "sub": str(identity),
            "exp": int(time.time() + expires.total_seconds()),
        }
        header = _encode({"alg": "HS256", "typ": "JWT"})
        body = _encode(payload)
        signature = _sign(header + "." + body)
        return header + "." + body + "." + signature

    def get_jwt_identity():
        return getattr(g, "jwt_identity", None)

    def jwt_required():
        def decorator(view):
            @wraps(view)
            def wrapper(*args, **kwargs):
                manager = current_app.extensions.get("jc_jwt")
                raw = request.headers.get("Authorization", "")
                if not raw.startswith("Bearer "):
                    if manager and manager.unauthorized_callback:
                        return manager.unauthorized_callback("missing")
                    return jsonify({"error": "Please log in"}), 401
                token = raw.split(" ", 1)[1].strip()
                try:
                    payload = _read(token)
                except _TokenExpired:
                    if manager and manager.expired_callback:
                        return manager.expired_callback({}, {})
                    return jsonify({"error": "Your session expired. Please log in again"}), 401
                except _TokenInvalid:
                    if manager and manager.invalid_callback:
                        return manager.invalid_callback("invalid")
                    return jsonify({"error": "Please log in again"}), 401
                g.jwt_identity = payload["sub"]
                return view(*args, **kwargs)

            return wrapper

        return decorator

    class _TokenInvalid(Exception):
        pass

    class _TokenExpired(Exception):
        pass

    def _encode(value):
        raw = json.dumps(value, separators=(",", ":")).encode("utf-8")
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")

    def _decode(segment):
        padding = "=" * (-len(segment) % 4)
        raw = base64.urlsafe_b64decode(segment + padding)
        return json.loads(raw.decode("utf-8"))

    def _sign(signing_input):
        secret = current_app.config["JWT_SECRET_KEY"].encode("utf-8")
        digest = hmac.new(secret, signing_input.encode("ascii"), hashlib.sha256).digest()
        return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")

    def _read(token):
        parts = token.split(".")
        if len(parts) != 3:
            raise _TokenInvalid()
        signing_input = parts[0] + "." + parts[1]
        expected = _sign(signing_input)
        if not hmac.compare_digest(expected, parts[2]):
            raise _TokenInvalid()
        payload = _decode(parts[1])
        if int(payload.get("exp", 0)) < int(time.time()):
            raise _TokenExpired()
        if "sub" not in payload:
            raise _TokenInvalid()
        return payload
