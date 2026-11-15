import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "jcsmart.sqlite")
con = sqlite3.connect(db_path)
cur = con.cursor()
cols = [c[1] for c in cur.execute("PRAGMA table_info(users)").fetchall()]

if "branch" not in cols:
    cur.execute("ALTER TABLE users ADD COLUMN branch VARCHAR(80) DEFAULT 'Computer Engineering'")
    print("Added branch column")

if "id_card_photo" not in cols:
    cur.execute("ALTER TABLE users ADD COLUMN id_card_photo TEXT")
    print("Added id_card_photo column")

con.commit()
print("Updated columns:", [c[1] for c in cur.execute("PRAGMA table_info(users)").fetchall()])
con.close()

