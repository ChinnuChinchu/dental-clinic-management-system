from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import DoctorLeave, DoctorProfile, WorkingHours

CLINIC_TZ = ZoneInfo(settings.CLINIC_TIMEZONE)


def now_local() -> datetime:
    return datetime.now(CLINIC_TZ)


def day_in_booking_range(day: date) -> bool:
    today = now_local().date()
    return today <= day <= today + timedelta(days=settings.MAX_ADVANCE_DAYS)


def get_available_slots(db: Session, doctor: DoctorProfile, day: date) -> list[datetime]:
    """Free slot start times for a doctor on a given day (clinic timezone)."""
    if not doctor.is_active or not day_in_booking_range(day):
        return []

    on_leave = db.scalar(
        select(DoctorLeave.id).where(
            DoctorLeave.doctor_id == doctor.id,
            DoctorLeave.start_date <= day,
            DoctorLeave.end_date >= day,
        ).limit(1)
    )
    if on_leave:
        return []

    windows = db.scalars(
        select(WorkingHours)
        .where(WorkingHours.doctor_id == doctor.id, WorkingHours.weekday == day.weekday())
        .order_by(WorkingHours.start_time)
    ).all()

    day_start = datetime.combine(day, time.min, tzinfo=CLINIC_TZ)
    day_end = day_start + timedelta(days=1)
    booked = set(
        db.scalars(
            select(Appointment.start_time).where(
                Appointment.doctor_id == doctor.id,
                Appointment.status == AppointmentStatus.booked,
                Appointment.start_time >= day_start,
                Appointment.start_time < day_end,
            )
        ).all()
    )

    step = timedelta(minutes=doctor.consultation_minutes)
    now = now_local()
    slots: list[datetime] = []
    for w in windows:
        cur = datetime.combine(day, w.start_time, tzinfo=CLINIC_TZ)
        end = datetime.combine(day, w.end_time, tzinfo=CLINIC_TZ)
        while cur + step <= end:
            if cur > now and cur not in booked:
                slots.append(cur)
            cur += step
    return slots