from datetime import timedelta

import pytest

from app.models.appointment import Appointment
from app.models.user import Role
from app.services.slots import now_local


@pytest.fixture
def staff(make_user, login):
    make_user("staff@test.com", Role.staff)
    return login("staff@test.com")


def today_appt(db, doctor, patient):
    """An appointment that starts now, so it is 'today' and 'already started'."""
    start = now_local()
    appt = Appointment(
        doctor_id=doctor["id"], patient_id=patient["id"],
        start_time=start, end_time=start + timedelta(minutes=30),
    )
    db.add(appt)
    db.commit()
    return appt


def patch(client, headers, appt_id, action):
    return client.patch(f"/api/appointments/{appt_id}/{action}", headers=headers)


def book_tomorrow(client, patient, doctor, slot_iso):
    r = client.post("/api/appointments", headers=patient["headers"],
                    json={"doctor_id": doctor["id"], "start_time": slot_iso(10)})
    assert r.status_code == 201
    return r.json()


def test_check_in_then_complete(client, db, doctor, patient, staff):
    appt = today_appt(db, doctor, patient)
    r = patch(client, staff, appt.id, "check-in")
    assert r.status_code == 200
    assert r.json()["checked_in_at"] is not None
    assert patch(client, staff, appt.id, "check-in").status_code == 400  # twice
    r = patch(client, staff, appt.id, "complete")
    assert r.status_code == 200
    assert r.json()["status"] == "completed"


def test_cannot_complete_without_check_in(client, db, doctor, patient, staff):
    appt = today_appt(db, doctor, patient)
    assert patch(client, staff, appt.id, "complete").status_code == 400


def test_cannot_check_in_future_day(client, doctor, patient, staff, slot_iso):
    appt = book_tomorrow(client, patient, doctor, slot_iso)
    assert patch(client, staff, appt["id"], "check-in").status_code == 400


def test_no_show_blocked_before_start(client, doctor, patient, staff, slot_iso):
    appt = book_tomorrow(client, patient, doctor, slot_iso)
    assert patch(client, staff, appt["id"], "no-show").status_code == 400


def test_no_show_after_start(client, db, doctor, patient, staff):
    appt = today_appt(db, doctor, patient)
    r = patch(client, staff, appt.id, "no-show")
    assert r.status_code == 200
    assert r.json()["status"] == "no_show"


def test_patient_cannot_use_reception_actions(client, db, doctor, patient):
    appt = today_appt(db, doctor, patient)
    assert patch(client, patient["headers"], appt.id, "check-in").status_code == 403
    r = client.post("/api/reception/patients", headers=patient["headers"],
                    json={"full_name": "X Y", "phone": "9876543210"})
    assert r.status_code == 403


def test_cannot_cancel_after_check_in(client, db, doctor, patient, staff):
    appt = today_appt(db, doctor, patient)
    patch(client, staff, appt.id, "check-in")
    assert patch(client, staff, appt.id, "cancel").status_code == 400


def test_walk_in_patient_without_email_can_be_booked(client, doctor, staff, slot_iso):
    r = client.post("/api/reception/patients", headers=staff,
                    json={"full_name": "Walk In", "phone": "9876543210"})
    assert r.status_code == 201
    assert r.json()["email"].endswith("@walkin.noemail")
    booked = client.post("/api/appointments", headers=staff, json={
        "doctor_id": doctor["id"], "start_time": slot_iso(10), "patient_id": r.json()["id"],
    })
    assert booked.status_code == 201


def test_patient_search(client, staff, make_user):
    make_user("ravi@test.com", Role.patient, "Ravi Kumar")
    make_user("meena@test.com", Role.patient, "Meena Nair")
    r = client.get("/api/users", headers=staff, params={"role": "patient", "q": "rav"})
    assert [u["full_name"] for u in r.json()] == ["Ravi Kumar"]


def test_affected_by_leave(client, doctor, patient, staff, admin_headers, slot_iso, tomorrow):
    appt = book_tomorrow(client, patient, doctor, slot_iso)
    assert client.get("/api/reception/affected-by-leave", headers=staff).json() == []

    client.post(f"/api/doctors/{doctor['id']}/leaves", headers=admin_headers, json={
        "start_date": tomorrow.isoformat(), "end_date": tomorrow.isoformat(),
    })
    affected = client.get("/api/reception/affected-by-leave", headers=staff).json()
    assert [a["id"] for a in affected] == [appt["id"]]


def test_affected_requires_staff(client, patient):
    r = client.get("/api/reception/affected-by-leave", headers=patient["headers"])
    assert r.status_code == 403