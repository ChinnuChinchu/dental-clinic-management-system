from datetime import timedelta

import pytest
from sqlalchemy import select

from app.models.appointment import Appointment, AppointmentStatus
from app.models.notification import Notification, NotificationStatus
from app.models.user import Role
from app.models.visit import Visit
from app.services import reminders
from app.services.slots import now_local


@pytest.fixture
def outbox(monkeypatch):
    sent = []
    monkeypatch.setattr(reminders, "send_email", lambda to, subject, body: sent.append((to, subject, body)))
    return sent


def make_appt(db, doctor, patient, hours, status=AppointmentStatus.booked):
    start = now_local() + timedelta(hours=hours)
    appt = Appointment(
        doctor_id=doctor["id"], patient_id=patient["id"],
        start_time=start, end_time=start + timedelta(minutes=30), status=status,
    )
    db.add(appt)
    db.commit()
    return appt


def make_visit(db, doctor, patient, follow_up_days):
    appt = make_appt(db, doctor, patient, -24, AppointmentStatus.completed)
    db.add(Visit(
        appointment_id=appt.id, doctor_id=doctor["id"], patient_id=patient["id"],
        follow_up_date=now_local().date() + timedelta(days=follow_up_days),
    ))
    db.commit()


def all_notes(db):
    return db.scalars(select(Notification)).all()


def test_reminder_is_sent_exactly_once(db, doctor, patient, outbox):
    make_appt(db, doctor, patient, 20)
    reminders.run_all(db)
    reminders.run_all(db)  # second run must not send again
    assert len(outbox) == 1
    to, subject, body = outbox[0]
    assert to == "patient@test.com"
    assert "Appointment reminder" in subject
    assert "Dr. Test" in body
    assert all_notes(db)[0].status == NotificationStatus.sent


def test_appointments_outside_window_are_ignored(db, doctor, patient, outbox):
    make_appt(db, doctor, patient, 30)   # too far ahead
    make_appt(db, doctor, patient, 0.5)  # too soon to be useful
    reminders.run_all(db)
    assert outbox == []
    assert all_notes(db) == []


def test_cancelled_appointment_gets_no_reminder(db, doctor, patient, outbox):
    make_appt(db, doctor, patient, 20, AppointmentStatus.cancelled)
    reminders.run_all(db)
    assert outbox == []


def test_walk_in_without_email_is_skipped_not_sent(db, doctor, make_user, outbox):
    walkin = make_user("walkin-abc123@walkin.noemail", Role.patient)
    make_appt(db, doctor, {"id": walkin.id}, 20)
    reminders.run_all(db)
    assert outbox == []
    note = all_notes(db)[0]
    assert note.status == NotificationStatus.skipped
    assert "phone" in note.error


def test_failed_send_retries_then_gives_up(db, doctor, patient, monkeypatch):
    def boom(to, subject, body):
        raise RuntimeError("smtp down")

    monkeypatch.setattr(reminders, "send_email", boom)
    now = now_local()
    make_appt(db, doctor, patient, 20)
    reminders.queue_appointment_reminders(db, now)

    reminders.send_pending(db, now)                          # attempt 1, retry in 15 min
    note = all_notes(db)[0]
    assert (note.status, note.attempts) == (NotificationStatus.pending, 1)
    assert "smtp down" in note.error

    reminders.send_pending(db, now + timedelta(minutes=5))   # too early, nothing happens
    assert all_notes(db)[0].attempts == 1

    reminders.send_pending(db, now + timedelta(minutes=20))  # attempt 2
    reminders.send_pending(db, now + timedelta(minutes=120)) # attempt 3, gives up
    note = all_notes(db)[0]
    assert (note.status, note.attempts) == (NotificationStatus.failed, 3)


def test_followup_reminder_sent_when_due_soon(db, doctor, patient, outbox):
    make_visit(db, doctor, patient, 5)
    reminders.run_all(db)
    assert len(outbox) == 1
    assert "checkup" in outbox[0][1]


def test_followup_not_sent_when_far_away(db, doctor, patient, outbox):
    make_visit(db, doctor, patient, 30)
    reminders.run_all(db)
    assert outbox == []


def test_followup_skipped_when_patient_already_booked(db, doctor, patient, outbox):
    make_visit(db, doctor, patient, 5)
    make_appt(db, doctor, patient, 72)  # already has a booking in 3 days
    reminders.run_all(db)
    assert outbox == []


def test_notification_permissions(client, patient, make_user, login):
    assert client.get("/api/notifications", headers=patient["headers"]).status_code == 403
    make_user("staff@test.com", Role.staff)
    staff = login("staff@test.com")
    assert client.get("/api/notifications", headers=staff).status_code == 200
    assert client.post("/api/notifications/run", headers=staff).status_code == 403


def test_admin_can_run_reminders_now(client, db, doctor, patient, admin_headers, outbox):
    make_appt(db, doctor, patient, 20)
    r = client.post("/api/notifications/run", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["appointment_reminders_created"] == 1
    assert r.json()["sent"] == 1

    rows = client.get("/api/notifications", headers=admin_headers).json()
    assert len(rows) == 1
    assert rows[0]["status"] == "sent"
    assert rows[0]["patient_name"] == "patient"


def test_beat_schedule_is_registered():
    from app.worker import celery_app
    assert "run-reminders" in celery_app.conf.beat_schedule