"""A ride offered by a student driver."""

from datetime import datetime

from app.extensions import db


class Ride(db.Model):
    __tablename__ = "rides"

    id = db.Column(db.Integer, primary_key=True)
    driver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    pickup_name = db.Column(db.String(120), nullable=False)
    pickup_lat = db.Column(db.Float, nullable=False)
    pickup_lng = db.Column(db.Float, nullable=False)
    drop_name = db.Column(db.String(120), nullable=False)
    drop_lat = db.Column(db.Float, nullable=False)
    drop_lng = db.Column(db.Float, nullable=False)
    ride_date = db.Column(db.Date, nullable=False)
    ride_time = db.Column(db.Time, nullable=False)
    seats_total = db.Column(db.Integer, nullable=False)
    seats_available = db.Column(db.Integer, nullable=False)
    cost_per_seat = db.Column(db.Float, nullable=False)
    women_only = db.Column(db.Boolean, nullable=False, default=False)
    status = db.Column(db.String(20), nullable=False, default="open")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    driver = db.relationship("User", foreign_keys=[driver_id])

    def to_dict(self, driver_rating=None, rating_count=0):
        return {
            "id": self.id,
            "driver": {
                "id": self.driver.id,
                "name": self.driver.name,
                "phone": self.driver.phone,
                "branch": self.driver.branch or "Computer Engineering",
                "average_rating": round(driver_rating, 1) if driver_rating is not None else None,
                "rating_count": rating_count,
            },
            "pickup": {
                "name": self.pickup_name,
                "latitude": self.pickup_lat,
                "longitude": self.pickup_lng,
            },
            "drop": {
                "name": self.drop_name,
                "latitude": self.drop_lat,
                "longitude": self.drop_lng,
            },
            "ride_date": self.ride_date.isoformat(),
            "ride_time": self.ride_time.strftime("%H:%M"),
            "seats_total": self.seats_total,
            "seats_available": self.seats_available,
            "cost_per_seat": float(self.cost_per_seat),
            "women_only": bool(self.women_only),
            "status": self.status,
        }
