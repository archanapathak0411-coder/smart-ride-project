import pytest
from werkzeug.security import generate_password_hash

from app import create_app
from app.config import TestConfig
from app.extensions import db
from app.models import Place, User


@pytest.fixture
def app():
    application = create_app(TestConfig)
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def add_user(
    name,
    email,
    student_id,
    role="student",
    status="verified",
    women_only=False,
    solo_fare=None,
):
    user = User(
        name=name,
        email=email,
        phone="9810011122",
        password_hash=generate_password_hash("Student@123"),
        student_id=student_id,
        role=role,
        verification_status=status,
        women_only_preference=women_only,
        typical_solo_fare=solo_fare,
    )
    db.session.add(user)
    db.session.commit()
    return user


def add_place(name, lat, lng):
    place = Place(name=name, latitude=lat, longitude=lng)
    db.session.add(place)
    db.session.commit()
    return place


def auth_header(client, email, password="Student@123"):
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    token = response.get_json()["access_token"]
    return {"Authorization": "Bearer " + token}
