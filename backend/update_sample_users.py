from app import create_app
from app.models import User
from app.extensions import db

app = create_app()

def make_card(name, roll, branch, status_text, bg_color, badge_color):
    return (
        f'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180">'
        f'<rect width="300" height="180" rx="10" fill="{bg_color}"/>'
        f'<rect x="8" y="8" width="284" height="164" rx="8" fill="white"/>'
        f'<rect x="18" y="22" width="55" height="65" rx="6" fill="#e2e8f0"/>'
        f'<circle cx="45" cy="45" r="16" fill="#94a3b8"/>'
        f'<path d="M 28 75 Q 45 60 62 75" fill="#94a3b8"/>'
        f'<text x="84" y="32" font-family="Arial,sans-serif" font-weight="bold" font-size="10" fill="{bg_color}">JC BOSE UNIVERSITY, YMCA</text>'
        f'<text x="84" y="48" font-family="Arial,sans-serif" font-weight="bold" font-size="12" fill="#1e293b">{name}</text>'
        f'<text x="84" y="64" font-family="Arial,sans-serif" font-size="10" fill="#64748b">Roll: {roll}</text>'
        f'<text x="84" y="78" font-family="Arial,sans-serif" font-size="10" fill="#64748b">Branch: {branch}</text>'
        f'<rect x="18" y="100" width="264" height="24" fill="#f8fafc" rx="4" stroke="#e2e8f0"/>'
        f'<text x="26" y="116" font-family="monospace" font-size="9" fill="#334155">STUDENT ID: {roll}</text>'
        f'<rect x="18" y="134" width="130" height="22" fill="{badge_color}" rx="4"/>'
        f'<text x="28" y="149" font-family="Arial,sans-serif" font-weight="bold" font-size="9" fill="white">{status_text}</text>'
        f'</svg>'
    )

with app.app_context():
    users = {
        'driver@jcsmart.local': ('Computer Engineering', make_card('Rahul Sharma', 'YM2021001', 'Computer Engineering', 'VERIFIED STUDENT', '#1e3a8a', '#16a34a')),
        'passenger@jcsmart.local': ('Information Technology', make_card('Ananya Gupta', 'YM2021042', 'Information Technology', 'VERIFIED STUDENT', '#0f766e', '#16a34a')),
        'neha@jcsmart.local': ('Electronics & Comm.', make_card('Neha Singh', 'YM2021060', 'Electronics & Comm.', 'VERIFIED STUDENT', '#7e22ce', '#16a34a')),
        'vikram@jcsmart.local': ('Mechanical Engineering', make_card('Vikram Yadav', 'YM2021077', 'Mechanical Engineering', 'VERIFIED STUDENT', '#0369a1', '#16a34a')),
        'pending@jcsmart.local': ('MCA', make_card('Pending Student', 'YM2021999', 'MCA', 'PENDING APPROVAL', '#b45309', '#d97706')),
    }
    for email, (branch, photo) in users.items():
        u = User.query.filter_by(email=email).first()
        if u:
            u.branch = branch
            u.id_card_photo = photo
    db.session.commit()
    print('Updated all demo users with branch and sample Student ID Cards!')

