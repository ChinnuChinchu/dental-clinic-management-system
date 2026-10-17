from datetime import timedelta

import pytest

from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import DoctorProfile
from app.models.user import Role
from app.services.slots import now_local


@pytest.fixture
def other_doctor(db, make_user, login):
    user = make_user("doc2@test.com", Role.doctor, "Dr. Other")
    profile = DoctorProfile(user_id=user.id, specialization="Ortho", consultation_minutes=30)
    db.add(profile)
    db.commit()
    return {"id": profile.id, "headers": login(user.email)}


def make_appt(db, doctor, patient, checked_in=True, status=AppointmentStatus.booked):
    start = now_local()
    appt = Appointment(
        doctor_id=doctor["id"], patient_id=patient["id"],
        start_time=start, end_time=start + timedelta(minutes=30),
        checked_in_at=start if checked_in else None, status=status,
    )
    db.add(appt)
    db.commit()
    return appt


def save(client, headers, appt_id, **fields):
    return client.put(f"/api/visits/appointment/{appt_id}", headers=headers, json=fields)


def in_days(n):
    return (now_local().date() + timedelta(days=n)).isoformat()


def test_doctor_saves_and_reads_visit(client, db, doctor, patient):
    appt = make_appt(db, doctor, patient)
    r = save(client, doctor["headers"], appt.id,
             diagnosis="Cavity", treatment_done="Filling", follow_up_date=in_days(180))
    assert r.status_code == 200
    got = client.get(f"/api/visits/appointment/{appt.id}", headers=doctor["headers"]).json()
    assert got["diagnosis"] == "Cavity"
    assert got["follow_up_date"] == in_days(180)


def test_cannot_save_before_check_in(client, db, doctor, patient):
    appt = make_appt(db, doctor, patient, checked_in=False)
    assert save(client, doctor["headers"], appt.id, diagnosis="x").status_code == 400


def test_cannot_save_for_cancelled(client, db, doctor, patient):
    appt = make_appt(db, doctor, patient, status=AppointmentStatus.cancelled)
    assert save(client, doctor["headers"], appt.id, diagnosis="x").status_code == 400


def test_mark_completed_updates_status(client, db, doctor, patient):
    appt = make_appt(db, doctor, patient)
    assert save(client, doctor["headers"], appt.id, diagnosis="x", mark_completed=True).status_code == 200
    listing = client.get("/api/appointments", headers=doctor["headers"]).json()
    assert listing[0]["status"] == "completed"


def test_visit_can_be_edited_after_completion(client, db, doctor, patient):
    appt = make_appt(db, doctor, patient)
    save(client, doctor["headers"], appt.id, diagnosis="First", mark_completed=True)
    r = save(client, doctor["headers"], appt.id, diagnosis="Corrected")
    assert r.status_code == 200
    history = client.get(f"/api/visits/patient/{patient['id']}", headers=doctor["headers"]).json()
    assert len(history) == 1  # updated, not duplicated
    assert history[0]["diagnosis"] == "Corrected"


def test_follow_up_in_past_rejected(client, db, doctor, patient):
    appt = make_appt(db, doctor, patient)
    assert save(client, doctor["headers"], appt.id, follow_up_date=in_days(-1)).status_code == 400


def test_other_doctor_cannot_touch_visit(client, db, doctor, patient, other_doctor):
    appt = make_appt(db, doctor, patient)
    h = other_doctor["headers"]
    assert client.get(f"/api/appointments/{appt.id}", headers=h).status_code == 404
    assert client.get(f"/api/visits/appointment/{appt.id}", headers=h).status_code == 404
    assert save(client, h, appt.id, diagnosis="x").status_code == 404


def test_patient_sees_own_visit_without_private_notes(client, db, doctor, patient):
    appt = make_appt(db, doctor, patient)
    save(client, doctor["headers"], appt.id, diagnosis="Gingivitis", notes="anxious patient")
    r = client.get("/api/visits/mine", headers=patient["headers"])
    assert r.status_code == 200
    assert r.json()[0]["diagnosis"] == "Gingivitis"
    assert "notes" not in r.json()[0]


def test_patient_cannot_use_doctor_routes(client, db, doctor, patient):
    appt = make_appt(db, doctor, patient)
    assert save(client, patient["headers"], appt.id, diagnosis="x").status_code == 403
    assert client.get(f"/api/visits/patient/{patient['id']}", headers=patient["headers"]).status_code == 403


def test_history_requires_a_relationship(client, db, doctor, patient, other_doctor):
    appt = make_appt(db, doctor, patient)
    save(client, doctor["headers"], appt.id, diagnosis="x")
    url = f"/api/visits/patient/{patient['id']}"
    assert len(client.get(url, headers=doctor["headers"]).json()) == 1
    assert client.get(url, headers=other_doctor["headers"]).status_code == 403