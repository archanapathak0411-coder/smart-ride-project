import sys
from pathlib import Path

# Local copies of Flask and SQLAlchemy, used when the lab image has no pip access.
_vendor = Path(__file__).resolve().parents[1] / ".vendor"
for _folder in (
    _vendor / "usr/lib/python3.9/site-packages",
    _vendor / "usr/lib64/python3.9/site-packages",
):
    if _folder.is_dir():
        folder_text = str(_folder)
        if folder_text not in sys.path:
            sys.path.insert(0, folder_text)

# Flask-SQLAlchemy, Flask-JWT-Extended and Flask-Cors are used when they
# are installed. The campus image does not ship them, so the fallback below
# keeps db.Column, db.session and User.query working with plain SQLAlchemy.

try:
    from flask_sqlalchemy import SQLAlchemy

    db = SQLAlchemy()
except ImportError:
    from sqlalchemy import (
        Boolean,
        Column,
        Date,
        DateTime,
        Float,
        ForeignKey,
        Integer,
        Numeric,
        String,
        Time,
        UniqueConstraint,
    )
    from sqlalchemy import create_engine
    from sqlalchemy.orm import declarative_base, relationship, scoped_session, sessionmaker

    class _QueryProperty:
        def __init__(self, database):
            self.database = database

        def __get__(self, obj, model):
            return self.database.session.query(model)

    class _Database:
        """The small part of Flask-SQLAlchemy this project actually uses."""

        def __init__(self):
            self.Column = Column
            self.Integer = Integer
            self.String = String
            self.Boolean = Boolean
            self.Date = Date
            self.Time = Time
            self.DateTime = DateTime
            self.Float = Float
            self.Numeric = Numeric
            self.ForeignKey = ForeignKey
            self.UniqueConstraint = UniqueConstraint
            self.relationship = relationship
            self.Model = declarative_base()
            self.Model.query = _QueryProperty(self)
            self.session = None
            self.engine = None

        def init_app(self, app):
            options = app.config.get("SQLALCHEMY_ENGINE_OPTIONS") or {}
            self.engine = create_engine(app.config["SQLALCHEMY_DATABASE_URI"], **options)
            factory = sessionmaker(bind=self.engine)
            self.session = scoped_session(factory)

            @app.teardown_appcontext
            def remove_session(_error):
                if self.session is not None:
                    self.session.remove()

        def create_all(self):
            # Import models so their tables are registered before creation.
            from app import models  # noqa: F401

            self.Model.metadata.create_all(self.engine)

        def drop_all(self):
            self.Model.metadata.drop_all(self.engine)

    db = _Database()

try:
    from flask_cors import CORS
except ImportError:
    from flask import request

    class CORS:
        """Adds the headers a browser needs to call the API."""

        def init_app(self, app, resources=None):
            @app.before_request
            def answer_preflight():
                if request.method == "OPTIONS":
                    return ("", 204)

            @app.after_request
            def add_cors_headers(response):
                response.headers["Access-Control-Allow-Origin"] = "*"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
                return response

from app.auth_tokens import JWTManager

jwt = JWTManager()
cors = CORS()
