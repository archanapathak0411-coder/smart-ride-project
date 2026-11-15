"""Feedback left after a completed shared ride."""

from datetime import datetime

from app.extensions import db


class Rating(db.Model):
    __tablename__ = "ratings"
    __table_args__ = (
        db.UniqueConstraint("booking_id", "rater_id", name="one_rating_per_person"),
    )

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False)
    rater_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    ratee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    stars = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(300), nullable=False, default="")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    booking = db.relationship("Booking")
    rater = db.relationship("User", foreign_keys=[rater_id])
    ratee = db.relationship("User", foreign_keys=[ratee_id])

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "rater_id": self.rater_id,
            "ratee_id": self.ratee_id,
            "stars": self.stars,
            "comment": self.comment,
        }
