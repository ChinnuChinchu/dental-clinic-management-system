from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import DoctorProfile
from app.models.user import Role, User
from app.models.visit import Visit
from app.schemas.visit import PatientVisitOut, VisitIn, VisitOut
from app.services.slots import now_local

router = APIRouter(prefix="/api/visits", tags=["visits"])


def doctor_profile(db: Session, user: User) -> DoctorProfile | None:
    return db.scalar(select(DoctorProfile).where(DoctorProfile.user_id == user.id))


def get_appointment_for(db: Session, appt_id: int, user: User) -> Appointment:
    """Doctors only reach their own appointments. Admin can read any."""
    appt = db.get(Appointment, appt_id)
    if not appt:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    if user.role == Role.doctor:
        profile = doctor_profile(db, user)
        if not profile or appt.doctor_id != profile.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    return appt


def check_follow_up(new: date | None, existing: date | None) -> None:
    if new is None or new == existing:  # editing an old visit keeps its old date
        return
    today = now_local().date()
    if new < today:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Follow-up date cannot be in the past")
    if new > today + timedelta(days=730):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Follow-up date is too far ahead")


# ---------- Patient ----------

@router.get("/mine", response_model=list[PatientVisitOut])
def my_visits(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.patient)),
):
    return db.scalars(
        select(Visit)
        .join(Appointment, Visit.appointment_id == Appointment.id)
        .where(Visit.patient_id == user.id)
        .order_by(Appointment.start_time.desc())
    ).all()


# ---------- Doctor / admin ----------

@router.get("/appointment/{appt_id}", response_model=VisitOut | None)
def get_visit(
    appt_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.doctor, Role.admin)),
):
    appt = get_appointment_for(db, appt_id, user)
    return db.scalar(select(Visit).where(Visit.appointment_id == appt.id))


@router.put("/appointment/{appt_id}", response_model=VisitOut)
def save_visit(
    appt_id: int,
    data: VisitIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.doctor)),
):
    """Create or update the record. Calling it again edits the same visit."""
    appt = get_appointment_for(db, appt_id, user)
    if appt.status in (AppointmentStatus.cancelled, AppointmentStatus.no_show):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Cannot record a visit for a {appt.status.value.replace('_', '-')} appointment",
        )
    if appt.status == AppointmentStatus.booked and not appt.checked_in_at:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The patient has not checked in yet")

    visit = db.scalar(select(Visit).where(Visit.appointment_id == appt.id))
    check_follow_up(data.follow_up_date, visit.follow_up_date if visit else None)
    if not visit:
        visit = Visit(appointment_id=appt.id, doctor_id=appt.doctor_id, patient_id=appt.patient_id)
        db.add(visit)

    for field in ("diagnosis", "treatment_done", "prescription", "notes", "follow_up_date"):
        setattr(visit, field, getattr(data, field))
    if data.mark_completed and appt.status == AppointmentStatus.booked:
        appt.status = AppointmentStatus.completed

    try:
        db.commit()
    except IntegrityError:  # two saves at the same instant
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Visit was just saved. Please reload.")
    db.refresh(visit)
    return visit


@router.get("/patient/{patient_id}", response_model=list[VisitOut])
def patient_history(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.doctor, Role.admin)),
):
    """A doctor sees the history only of patients they have an appointment with."""
    if user.role == Role.doctor:
        profile = doctor_profile(db, user)
        related = profile and db.scalar(
            select(Appointment.id)
            .where(Appointment.patient_id == patient_id, Appointment.doctor_id == profile.id)
            .limit(1)
        )
        if not related:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")
    return db.scalars(
        select(Visit)
        .join(Appointment, Visit.appointment_id == Appointment.id)
        .where(Visit.patient_id == patient_id)
        .order_by(Appointment.start_time.desc())
    ).all()