from datetime import timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.appointment import Appointment
from app.models.user import Role
from app.services.slots import now_local


def book(client, headers, doctor_id, start, **extra):
    return client.post(
        "/api/appointments", headers=headers,
        json={"doctor_id": doctor_id, "start_time": start, **extra},
    )


def slot_times(client, doctor_id, day):
    r = client.get(f"/api/doctors/{doctor_id}/slots", params={"date": day.isoformat()})
    return [s[11:16] for s in r.json()["slots"]]


def test_patient_can_book(client, doctor, patient, slot_iso, tomorrow):
    r = book(client, patient["headers"], doctor["id"], slot_iso(10), reason="Tooth pain")
    assert r.status_code == 201
    assert r.json()["status"] == "booked"
    assert "10:00" not in slot_times(client, doctor["id"], tomorrow)


def test_double_booking_is_blocked(client, doctor, patient, make_user, login, slot_iso):
    assert book(client, patient["headers"], doctor["id"], slot_iso(10)).status_code == 201

    make_user("other@test.com", Role.patient)
    other = login("other@test.com")
    assert book(client, other, doctor["id"], slot_iso(10)).status_code == 409


def test_time_not_on_slot_grid_rejected(client, doctor, patient, slot_iso):
    assert book(client, patient["headers"], doctor["id"], slot_iso(10, 10)).status_code == 409


def test_time_outside_working_hours_rejected(client, doctor, patient, slot_iso):
    assert book(client, patient["headers"], doctor["id"], slot_iso(20)).status_code == 409


def test_cancel_frees_the_slot(client, doctor, patient, slot_iso, tomorrow):
    appt = book(client, patient["headers"], doctor["id"], slot_iso(11)).json()
    r = client.patch(f"/api/appointments/{appt['id']}/cancel", headers=patient["headers"])
    assert r.status_code == 200
    assert r.json()["status"] == "cancelled"
    assert "11:00" in slot_times(client, doctor["id"], tomorrow)
    # and someone can book it again
    assert book(client, patient["headers"], doctor["id"], slot_iso(11)).status_code == 201


def test_patient_cannot_cancel_someone_elses(client, doctor, patient, make_user, login, slot_iso):
    appt = book(client, patient["headers"], doctor["id"], slot_iso(10)).json()
    make_user("other@test.com", Role.patient)
    r = client.patch(f"/api/appointments/{appt['id']}/cancel", headers=login("other@test.com"))
    assert r.status_code == 404


def test_cannot_cancel_inside_cutoff_window(client, doctor, patient, db):
    soon = now_local() + timedelta(hours=1)
    appt = Appointment(
        doctor_id=doctor["id"], patient_id=patient["id"],
        start_time=soon, end_time=soon + timedelta(minutes=30),
    )
    db.add(appt)
    db.commit()
    r = client.patch(f"/api/appointments/{appt.id}/cancel", headers=patient["headers"])
    assert r.status_code == 400


def test_reschedule_moves_the_booking(client, doctor, patient, slot_iso, tomorrow):
    appt = book(client, patient["headers"], doctor["id"], slot_iso(10)).json()
    r = client.patch(
        f"/api/appointments/{appt['id']}/reschedule",
        headers=patient["headers"], json={"start_time": slot_iso(11)},
    )
    assert r.status_code == 200
    times = slot_times(client, doctor["id"], tomorrow)
    assert "10:00" in times and "11:00" not in times


def test_staff_must_specify_patient(client, doctor, patient, make_user, login, slot_iso):
    make_user("staff@test.com", Role.staff)
    staff = login("staff@test.com")
    assert book(client, staff, doctor["id"], slot_iso(10)).status_code == 400
    r = book(client, staff, doctor["id"], slot_iso(10), patient_id=patient["id"])
    assert r.status_code == 201


def test_database_constraint_blocks_duplicate_active_slot(db, doctor, patient):
    """Safety net: even if the API check is bypassed, Postgres refuses the duplicate."""
    start = now_local() + timedelta(days=1)
    make = lambda: Appointment(
        doctor_id=doctor["id"], patient_id=patient["id"],
        start_time=start, end_time=start + timedelta(minutes=30),
    )
    db.add(make())
    db.commit()
    db.add(make())
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()