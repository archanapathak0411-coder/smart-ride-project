"""Create tables and demo data. Safe to run more than once."""

from datetime import time

from werkzeug.security import generate_password_hash

from app import create_app
from app.clock import now_ist
from app.config import Config
from app.extensions import db
from app.models import Booking, Place, Ride, User

# Approximate public coordinates around Faridabad. Campus pin matches the
# published location of J.C. Bose University, Sector 6, Mathura Road.
PLACES = [
    ("JC Bose University (Campus)", 28.36747, 77.31589),
    ("Sector 15", 28.39680, 77.31620),
    ("Sector 16", 28.40240, 77.32010),
    ("Sector 21", 28.42150, 77.30780),
    ("Sector 9", 28.37400, 77.32500),
    ("Old Faridabad", 28.40890, 77.31000),
    ("NIT Faridabad", 28.38120, 77.31480),
    ("Ballabhgarh", 28.33940, 77.31960),
    ("Badarpur Border", 28.49350, 77.30300),
]

STUDENT_PASSWORD = "Student@123"


def seed():
    _seed_places()
    admin = _seed_user(
        name="Campus Admin",
        email=Config.ADMIN_EMAIL,
        phone="9810000000",
        password=Config.ADMIN_PASSWORD,
        student_id="ADMIN001",
        role="admin",
        verification_status="verified",
    )
    rahul = _seed_user(
        name="Rahul Sharma",
        email="driver@jcsmart.local",
        phone="9810000001",
        password=STUDENT_PASSWORD,
        student_id="YM2021001",
        verification_status="verified",
    )
    ananya = _seed_user(
        name="Ananya Gupta",
        email="passenger@jcsmart.local",
        phone="9810000002",
        password=STUDENT_PASSWORD,
        student_id="YM2021042",
        verification_status="verified",
        typical_solo_fare=120,
    )
    neha = _seed_user(
        name="Neha Singh",
        email="neha@jcsmart.local",
        phone="9810000003",
        password=STUDENT_PASSWORD,
        student_id="YM2021060",
        verification_status="verified",
        women_only_preference=True,
    )
    vikram = _seed_user(
        name="Vikram Yadav",
        email="vikram@jcsmart.local",
        phone="9810000004",
        password=STUDENT_PASSWORD,
        student_id="YM2021077",
        verification_status="verified",
    )
    _seed_user(
        name="Pending Student",
        email="pending@jcsmart.local",
        phone="9810000005",
        password=STUDENT_PASSWORD,
        student_id="YM2021999",
        verification_status="pending",
    )

    today = now_ist().date()
    campus = _place("JC Bose University (Campus)")
    sector_16 = _place("Sector 16")
    sector_21 = _place("Sector 21")
    badarpur = _place("Badarpur Border")
    ballabhgarh = _place("Ballabhgarh")

    _seed_ride(
        rahul,
        sector_16,
        campus,
        today,
        time(8, 31),
        seats=3,
        cost=40,
        women_only=False,
    )
    _seed_ride(
        neha,
        sector_21,
        campus,
        today,
        time(8, 45),
        seats=2,
        cost=50,
        women_only=True,
    )
    _seed_ride(
        vikram,
        badarpur,
        ballabhgarh,
        today,
        time(18, 0),
        seats=2,
        cost=180,
        women_only=False,
    )
    _seed_completed_trip(rahul, ananya, sector_16, campus)
    db.session.commit()
    print("Seed data is ready.")
    print("Admin: %s / %s" % (admin.email, Config.ADMIN_PASSWORD))
    print("Driver: driver@jcsmart.local / %s" % STUDENT_PASSWORD)
    print("Passenger: passenger@jcsmart.local / %s" % STUDENT_PASSWORD)


def _seed_places():
    for name, lat, lng in PLACES:
        if Place.query.filter_by(name=name).first() is None:
            db.session.add(Place(name=name, latitude=lat, longitude=lng))
    db.session.commit()


def _seed_user(
    name,
    email,
    phone,
    password,
    student_id,
    role="student",
    verification_status="verified",
    women_only_preference=False,
    typical_solo_fare=None,
):
    existing = User.query.filter_by(email=email).first()
    if existing is not None:
        return existing
    user = User(
        name=name,
        email=email,
        phone=phone,
        password_hash=generate_password_hash(password),
        student_id=student_id,
        role=role,
        verification_status=verification_status,
        women_only_preference=women_only_preference,
        typical_solo_fare=typical_solo_fare,
    )
    db.session.add(user)
    db.session.commit()
    return user


def _place(name):
    place = Place.query.filter_by(name=name).first()
    if place is None:
        raise RuntimeError("Missing place: " + name)
    return place


def _seed_ride(driver, pickup, drop, ride_date, ride_time, seats, cost, women_only):
    existing = Ride.query.filter_by(
        driver_id=driver.id, ride_date=ride_date, ride_time=ride_time
    ).first()
    if existing is not None:
        return existing
    ride = Ride(
        driver_id=driver.id,
        pickup_name=pickup.name,
        pickup_lat=pickup.latitude,
        pickup_lng=pickup.longitude,
        drop_name=drop.name,
        drop_lat=drop.latitude,
        drop_lng=drop.longitude,
        ride_date=ride_date,
        ride_time=ride_time,
        seats_total=seats,
        seats_available=seats,
        cost_per_seat=cost,
        women_only=women_only,
        status="open",
    )
    db.session.add(ride)
    db.session.commit()
    return ride


def _seed_completed_trip(driver, passenger, pickup, drop):
    ride_date = now_ist().date().replace(day=1)
    ride_time = time(9, 0)
    ride = Ride.query.filter_by(
        driver_id=driver.id, ride_date=ride_date, ride_time=ride_time
    ).first()
    if ride is None:
        ride = Ride(
            driver_id=driver.id,
            pickup_name=pickup.name,
            pickup_lat=pickup.latitude,
            pickup_lng=pickup.longitude,
            drop_name=drop.name,
            drop_lat=drop.latitude,
            drop_lng=drop.longitude,
            ride_date=ride_date,
            ride_time=ride_time,
            seats_total=3,
            seats_available=2,
            cost_per_seat=40,
            women_only=False,
            status="completed",
        )
        db.session.add(ride)
        db.session.commit()
    booking = Booking.query.filter_by(ride_id=ride.id, passenger_id=passenger.id).first()
    if booking is None:
        db.session.add(
            Booking(ride_id=ride.id, passenger_id=passenger.id, status="completed")
        )
        db.session.commit()


def main():
    app = create_app()
    with app.app_context():
        db.create_all()
        seed()


if __name__ == "__main__":
    main()
