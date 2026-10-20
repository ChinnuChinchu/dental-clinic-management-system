from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constants import WALKIN_EMAIL_DOMAIN
from app.models.appointment import Appointment, AppointmentStatus
from app.models.notification import (
    Notification, NotificationChannel, NotificationKind, NotificationStatus,
)
from app.models.user import User
from app.models.visit import Visit
from app.services.email import send_email
from app.services.messages import appointment_message, followup_message
from app.services.slots import now_local

# Appointments starting between 1 and 24 hours from now get a reminder.
# (Under 1 hour is too late to be useful.)
APPT_MIN_LEAD = timedelta(hours=1)
APPT_MAX_LEAD = timedelta(hours=24)
FOLLOWUP_LEAD_DAYS = 7
MAX_ATTEMPTS = 3


def _create(db: Session, now: datetime, user: User, kind: NotificationKind,
            key: str, subject: str, body: str, **refs) -> Notification | None:
    """Insert one notification unless this exact reminder already exists."""
    if db.scalar(select(Notification.id).where(Notification.dedupe_key == key)):
        return None

    placeholder = user.email.endswith("@" + WALKIN_EMAIL_DOMAIN)
    problem = None
    if not user.is_active:
        problem = "Account is inactive."
    elif placeholder:
        problem = "No email address on file. Contact the patient by phone."

    note = Notification(
        user_id=user.id, kind=kind, channel=NotificationChannel.email,
        status=NotificationStatus.skipped if problem else NotificationStatus.pending,
        dedupe_key=key, recipient="" if placeholder else user.email,
        subject=subject, body=body, error=problem, next_attempt_at=now, **refs,
    )
    try:
        with db.begin_nested():  # a savepoint: a duplicate from a race only undoes this row
            db.add(note)
    except IntegrityError:
        return None
    return note


def queue_appointment_reminders(db: Session, now: datetime | None = None) -> int:
    now = now or now_local()
    appts = db.scalars(
        select(Appointment).where(
            Appointment.status == AppointmentStatus.booked,
            Appointment.start_time > now + APPT_MIN_LEAD,
            Appointment.start_time <= now + APPT_MAX_LEAD,
        )
    ).all()
    created = 0
    for appt in appts:
        subject, body = appointment_message(appt)
        if _create(db, now, appt.patient, NotificationKind.appointment_reminder,
                   f"appt:{appt.id}", subject, body, appointment_id=appt.id):
            created += 1
    db.commit()
    return created


def queue_followup_reminders(db: Session, now: datetime | None = None) -> int:
    now = now or now_local()
    today = now.date()
    visits = db.scalars(
        select(Visit).where(
            Visit.follow_up_date >= today,
            Visit.follow_up_date <= today + timedelta(days=FOLLOWUP_LEAD_DAYS),
        )
    ).all()
    created = 0
    for v in visits:
        # Already booked? Then the reminder has done its job.
        has_upcoming = db.scalar(
            select(Appointment.id).where(
                Appointment.patient_id == v.patient_id,
                Appointment.status == AppointmentStatus.booked,
                Appointment.start_time > now,
            ).limit(1)
        )
        # Already seen since this visit? Then this follow-up is outdated.
        seen_since = db.scalar(
            select(Appointment.id).where(
                Appointment.patient_id == v.patient_id,
                Appointment.status == AppointmentStatus.completed,
                Appointment.start_time > v.appointment.start_time,
            ).limit(1)
        )
        if has_upcoming or seen_since:
            continue

        user = db.get(User, v.patient_id)
        subject, body = followup_message(user, v)
        # The date is in the key, so changing the follow-up date allows a fresh reminder.
        if _create(db, now, user, NotificationKind.followup_reminder,
                   f"followup:{v.id}:{v.follow_up_date.isoformat()}", subject, body, visit_id=v.id):
            created += 1
    db.commit()
    return created


def deliver(note: Notification) -> None:
    """The one place that knows how to send. WhatsApp or SMS plug in here later."""
    if note.channel == NotificationChannel.email:
        send_email(note.recipient, note.subject, note.body)
    else:
        raise RuntimeError(f"Unsupported channel: {note.channel}")


def _is_stale(db: Session, note: Notification, now: datetime) -> bool:
    if note.kind == NotificationKind.appointment_reminder:
        appt = db.get(Appointment, note.appointment_id)
        return not appt or appt.status != AppointmentStatus.booked or appt.start_time <= now
    return False


def send_pending(db: Session, now: datetime | None = None, limit: int = 100) -> dict:
    now = now or now_local()
    result = {"sent": 0, "retrying": 0, "failed": 0, "skipped": 0}
    for _ in range(limit):
        # One row at a time, locked: two workers can never send the same reminder.
        note = db.scalar(
            select(Notification)
            .where(Notification.status == NotificationStatus.pending,
                   Notification.next_attempt_at <= now)
            .order_by(Notification.id)
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        if not note:
            break

        if _is_stale(db, note, now):
            note.status = NotificationStatus.skipped
            note.error = "Appointment is no longer upcoming."
            result["skipped"] += 1
        else:
            note.attempts += 1
            try:
                deliver(note)
                note.status = NotificationStatus.sent
                note.sent_at = now
                note.error = None
                result["sent"] += 1
            except Exception as exc:  # noqa: BLE001  (any send failure must be recorded)
                note.error = str(exc)[:500]
                if note.attempts >= MAX_ATTEMPTS:
                    note.status = NotificationStatus.failed
                    result["failed"] += 1
                else:
                    note.next_attempt_at = now + timedelta(minutes=15 * note.attempts)
                    result["retrying"] += 1
        db.commit()
    return result


def run_all(db: Session, now: datetime | None = None) -> dict:
    now = now or now_local()
    return {
        "appointment_reminders_created": queue_appointment_reminders(db, now),
        "followup_reminders_created": queue_followup_reminders(db, now),
        **send_pending(db, now),
    }