from app.models.user import Role


def doctor_payload(**overrides):
    return {
        "full_name": "Dr. New", "email": "new@test.com", "password": "Password@123",
        "specialization": "Orthodontist", "qualification": "BDS, MDS",
        "consultation_minutes": 30, **overrides,
    }


def test_admin_creates_doctor_with_account(client, admin_headers):
    r = client.post("/api/admin/doctors", headers=admin_headers, json=doctor_payload())
    assert r.status_code == 201
    assert r.json()["email"] == "new@test.com"
    assert r.json()["full_name"] == "Dr. New"

    # the new doctor can log in straight away
    login = client.post("/api/auth/login", data={"username": "new@test.com", "password": "Password@123"})
    assert login.status_code == 200
    assert login.json()["user"]["role"] == "doctor"


def test_duplicate_email_rejected(client, admin_headers):
    assert client.post("/api/admin/doctors", headers=admin_headers, json=doctor_payload()).status_code == 201
    assert client.post("/api/admin/doctors", headers=admin_headers, json=doctor_payload()).status_code == 409


def test_only_admin_can_use_admin_routes(client, patient, make_user, login):
    assert client.get("/api/admin/doctors").status_code == 401
    assert client.get("/api/admin/doctors", headers=patient["headers"]).status_code == 403
    make_user("staff@test.com", Role.staff)
    staff = login("staff@test.com")
    r = client.post("/api/admin/doctors", headers=staff, json=doctor_payload())
    assert r.status_code == 403


def test_deactivated_doctor_hidden_and_cannot_login(client, admin_headers):
    doc = client.post("/api/admin/doctors", headers=admin_headers, json=doctor_payload()).json()
    r = client.patch(f"/api/admin/doctors/{doc['id']}", headers=admin_headers, json={"is_active": False})
    assert r.status_code == 200

    assert client.get("/api/doctors").json() == []                                   # hidden from patients
    assert len(client.get("/api/admin/doctors", headers=admin_headers).json()) == 1  # admin still sees it
    login = client.post("/api/auth/login", data={"username": "new@test.com", "password": "Password@123"})
    assert login.status_code == 403


def test_duration_change_blocked_with_upcoming_bookings(client, doctor, patient, admin_headers, slot_iso):
    booked = client.post("/api/appointments", headers=patient["headers"],
                         json={"doctor_id": doctor["id"], "start_time": slot_iso(10)})
    assert booked.status_code == 201
    r = client.patch(f"/api/admin/doctors/{doctor['id']}", headers=admin_headers,
                     json={"consultation_minutes": 45})
    assert r.status_code == 409


def test_duration_change_allowed_without_bookings(client, doctor, admin_headers):
    r = client.patch(f"/api/admin/doctors/{doctor['id']}", headers=admin_headers,
                     json={"consultation_minutes": 45, "specialization": "Endodontist"})
    assert r.status_code == 200
    assert r.json()["consultation_minutes"] == 45
    assert r.json()["specialization"] == "Endodontist"


def test_admin_can_deactivate_staff(client, admin_headers, make_user):
    staff = make_user("staff@test.com", Role.staff)
    r = client.patch(f"/api/users/{staff.id}", headers=admin_headers, json={"is_active": False})
    assert r.status_code == 200
    login = client.post("/api/auth/login", data={"username": "staff@test.com", "password": "Password@123"})
    assert login.status_code == 403


def test_admin_cannot_deactivate_self(client, admin_headers):
    me = client.get("/api/users/me", headers=admin_headers).json()
    r = client.patch(f"/api/users/{me['id']}", headers=admin_headers, json={"is_active": False})
    assert r.status_code == 400