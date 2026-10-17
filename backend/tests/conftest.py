from datetime import datetime, time, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  (registers all tables on Base.metadata)
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.doctor import DoctorProfile, WorkingHours
from app.models.user import Role, User
from app.services.slots import CLINIC_TZ, now_local

PASSWORD = "Password@123"

# Same server as dev, different database. The guard below makes it impossible
# to accidentally wipe the dev database.
TEST_URL = settings.DATABASE_URL.rsplit("/", 1)[0] + "/clinic_test"
assert TEST_URL.endswith("clinic_test")

engine = create_engine(TEST_URL, pool_pre_ping=True)
TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def create_schema():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_tables():
    """Runs after every test: empty all tables so tests stay independent."""
    yield
    names = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {names} RESTART IDENTITY CASCADE"))


def override_get_db():
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = TestingSession()
    yield session
    session.close()


@pytest.fixture
def make_user(db):
    def _make(email: str, role: Role, name: str | None = None) -> User:
        user = User(
            full_name=name or email.split("@")[0],
            email=email,
            hashed_password=hash_password(PASSWORD),
            role=role,
        )
        db.add(user)
        db.commit()
        return user

    return _make


@pytest.fixture
def login(client):
    def _login(email: str) -> dict:
        r = client.post("/api/auth/login", data={"username": email, "password": PASSWORD})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    return _login


@pytest.fixture
def admin_headers(make_user, login):
    make_user("admin@test.com", Role.admin)
    return login("admin@test.com")


@pytest.fixture
def patient(make_user, login):
    user = make_user("patient@test.com", Role.patient)
    return {"id": user.id, "headers": login(user.email)}


@pytest.fixture
def doctor(db, make_user, login):
    """A doctor who works 10:00-13:00 every day (30-min slots = 6 slots/day)."""
    user = make_user("doc@test.com", Role.doctor, "Dr. Test")
    profile = DoctorProfile(user_id=user.id, specialization="General", consultation_minutes=30)
    db.add(profile)
    db.flush()
    for weekday in range(7):
        db.add(WorkingHours(
            doctor_id=profile.id, weekday=weekday,
            start_time=time(10, 0), end_time=time(13, 0),
        ))
    db.commit()
    return {"id": profile.id, "user_id": user.id, "headers": login(user.email)}


@pytest.fixture
def tomorrow():
    return now_local().date() + timedelta(days=1)


@pytest.fixture
def slot_iso(tomorrow):
    """slot_iso(10, 30) -> tomorrow 10:30 as an ISO string with +05:30 offset."""
    def _iso(hour: int, minute: int = 0) -> str:
        return datetime.combine(tomorrow, time(hour, minute), tzinfo=CLINIC_TZ).isoformat()

    return _iso