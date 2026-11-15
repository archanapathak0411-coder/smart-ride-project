"""Build the Flask app and connect every blueprint."""

from flask import Flask, jsonify

from app.config import Config
from app.errors import ApiError
from app.extensions import cors, db, jwt


def create_app(config_object=None):
    app = Flask(__name__)
    app.config.from_object(config_object or Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    _register_handlers(app)
    _register_routes(app)
    return app


def _register_routes(app):
    from app.routes.admin import bp as admin_bp
    from app.routes.auth import bp as auth_bp
    from app.routes.bookings import bp as bookings_bp
    from app.routes.places import bp as places_bp
    from app.routes.ratings import bp as ratings_bp
    from app.routes.rides import bp as rides_bp
    from app.routes.savings import bp as savings_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(places_bp, url_prefix="/api/places")
    app.register_blueprint(rides_bp, url_prefix="/api/rides")
    app.register_blueprint(bookings_bp, url_prefix="/api/bookings")
    app.register_blueprint(ratings_bp, url_prefix="/api/ratings")
    app.register_blueprint(savings_bp, url_prefix="/api/savings")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "name": "JC Smart Ride"})

    @app.get("/")
    def index():
        return jsonify(
            {
                "name": "JC Smart Ride API",
                "health": "/api/health",
                "hint": "Open the website on port 5173. This port is the API.",
            }
        )


def _register_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error):
        db.session.rollback()
        return jsonify({"error": error.message}), error.status

    @jwt.unauthorized_loader
    def missing_token(_reason):
        return jsonify({"error": "Please log in"}), 401

    @jwt.invalid_token_loader
    def invalid_token(_reason):
        return jsonify({"error": "Please log in again"}), 401

    @jwt.expired_token_loader
    def expired_token(_header, _payload):
        return jsonify({"error": "Your session expired. Please log in again"}), 401

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_error):
        return jsonify({"error": "Method not allowed"}), 405
