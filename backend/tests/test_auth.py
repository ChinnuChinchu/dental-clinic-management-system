from app.models.user import Role


def test_register_creates_patient(client):
    r = client.post("/api/auth/register", json={
        "full_name": "Ravi Kumar", "email": "ravi@test.com", "password": "Password@123",
    })
    assert r.status_code == 201
    assert r.json()["role"] == "patient"


def test_register_rejects_duplicate_email(client):
    body = {"full_name": "Ravi Kumar", "email": "ravi@test.com", "password": "Password@123"}
    assert client.post("/api/auth/register", json=body).status_code == 201
    assert client.post("/api/auth/register", json=body).status_code == 409


def test_register_rejects_short_password(client):
    r = client.post("/api/auth/register", json={
        "full_name": "Ravi Kumar", "email": "ravi@test.com", "password": "short",
    })
    assert r.status_code == 422


def test_login_success_returns_token(client, make_user):
    make_user("a@test.com", Role.patient)
    r = client.post("/api/auth/login", data={"username": "a@test.com", "password": "Password@123"})
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_login_wrong_password(client, make_user):
    make_user("a@test.com", Role.patient)
    r = client.post("/api/auth/login", data={"username": "a@test.com", "password": "wrong-pass"})
    assert r.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/users/me").status_code == 401


def test_patient_cannot_list_users(client, patient):
    assert client.get("/api/users", headers=patient["headers"]).status_code == 403


def test_admin_can_create_doctor_account(client, admin_headers):
    r = client.post("/api/users", headers=admin_headers, json={
        "full_name": "Dr. Anita", "email": "anita@test.com",
        "password": "Password@123", "role": "doctor",
    })
    assert r.status_code == 201
    assert r.json()["role"] == "doctor"