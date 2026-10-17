from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import Role, User

EMAIL = "admin@clinic.com"
PASSWORD = "Admin@12345"  # change after first login

db = SessionLocal()
if db.scalar(select(User).where(User.email == EMAIL)):
    print("Admin already exists")
else:
    db.add(User(full_name="Clinic Admin", email=EMAIL,
                hashed_password=hash_password(PASSWORD), role=Role.admin))
    db.commit()
    print("Admin created:", EMAIL)
db.close()