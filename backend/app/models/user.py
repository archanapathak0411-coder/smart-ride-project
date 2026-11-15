"""Student and admin accounts."""

from datetime import datetime

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    student_id = db.Column(db.String(30), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False, default="student")
    verification_status = db.Column(db.String(20), nullable=False, default="pending")
    women_only_preference = db.Column(db.Boolean, nullable=False, default=False)
    typical_solo_fare = db.Column(db.Float, nullable=True)
    branch = db.Column(db.String(80), nullable=True, default="Computer Engineering")
    id_card_photo = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        fare = self.typical_solo_fare
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "student_id": self.student_id,
            "role": self.role,
            "verification_status": self.verification_status,
            "women_only_preference": bool(self.women_only_preference),
            "typical_solo_fare": None if fare is None else float(fare),
            "branch": self.branch or "Computer Engineering",
            "id_card_photo": self.id_card_photo,
        }
