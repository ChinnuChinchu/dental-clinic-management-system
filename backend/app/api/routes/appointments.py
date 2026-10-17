from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.config import settings
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import DoctorProfile
from app.models.user import Role, User
from app.schemas.appointment import AppointmentCreateIn, AppointmentOut, RescheduleIn
from app.services.slots import CLINIC_TZ, get_available_slots, now_local

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

SLOT_TAKEN = "That slot is not available. Please pick another one."


def validate_slot(db: Session, doctor: DoctorProfile, start_time: datetime) -> datetime:
    start_local = start_time.astimezone(CLINIC_TZ)
    if start_local not in get_available_slots(db, doctor, start_local.date()):
        raise HTTPException(status.HTTP_409_CONFLICT, SLOT_TAKEN)
    return start_local


def get_appointment_for_user(db: Session, appt_id: int, user: User) -> Appointment:
    appt = db.get(Appointment, appt_id)
    if not appt or (user.role == Role.patient and appt.patient_id != user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    if appt.status != AppointmentStatus.booked:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Appointment is already {appt.status.value}")
    if appt.checked_in_at:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Patient has already checked in")
    if user.role == Role.patient:
        cutoff = timedelta(hours=settings.CANCEL_CUTOFF_HOURS)
        if appt.start_time - now_local() < cutoff:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Changes are not allowed within {settings.CANCEL_CUTOFF_HOURS} hours of the "
                "appointment. Please call the clinic.",
            )
    return appt


@router.post("", response_model=AppointmentOut, status_code=201)
def book(
    data: AppointmentCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.patient, Role.staff, Role.admin)),
):
    doctor = db.get(DoctorProfile, data.doctor_id)
    if not doctor or not doctor.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Doctor not found")

    if user.role == Role.patient:
        patient_id = user.id
    else:
        if not data.patient_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "patient_id is required")
        patient = db.get(User, data.patient_id)
        if not patient or patient.role != Role.patient:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid patient")
        patient_id = patient.id

    start_local = validate_slot(db, doctor, data.start_time)
    appt = Appointment(
        doctor_id=doctor.id,
        patient_id=patient_id,
        start_time=start_local,
        end_time=start_local + timedelta(minutes=doctor.consultation_minutes),
        reason=data.reason,
    )
    db.add(appt)
    try:
        db.commit()
    except IntegrityError:  # someone else grabbed it a split second earlier
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, SLOT_TAKEN)
    db.refresh(appt)
    return appt


@router.get("/mine", response_model=list[AppointmentOut])
def my_appointments(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.patient)),
):
    return db.scalars(
        select(Appointment)
        .where(Appointment.patient_id == user.id)
        .order_by(Appointment.start_time.desc())
    ).all()


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    day: date | None = Query(None, alias="date"),
    doctor_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.admin, Role.staff, Role.doctor)),
):
    """Staff/admin see everything. A doctor sees only their own patients."""
    stmt = select(Appointment).order_by(Appointment.start_time)
    if user.role == Role.doctor:
        profile = db.scalar(select(DoctorProfile).where(DoctorProfile.user_id == user.id))
        if not profile:
            return []
        doctor_id = profile.id
    if doctor_id:
        stmt = stmt.where(Appointment.doctor_id == doctor_id)
    if day:
        start = datetime.combine(day, time.min, tzinfo=CLINIC_TZ)
        stmt = stmt.where(
            Appointment.start_time >= start,
            Appointment.start_time < start + timedelta(days=1),
        )
    return db.scalars(stmt).all()


@router.patch("/{appt_id}/cancel", response_model=AppointmentOut)
def cancel(
    appt_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.patient, Role.staff, Role.admin)),
):
    appt = get_appointment_for_user(db, appt_id, user)
    appt.status = AppointmentStatus.cancelled
    appt.cancelled_at = now_local()
    db.commit()
    db.refresh(appt)
    return appt


@router.patch("/{appt_id}/reschedule", response_model=AppointmentOut)
def reschedule(
    appt_id: int,
    data: RescheduleIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.patient, Role.staff, Role.admin)),
):
    appt = get_appointment_for_user(db, appt_id, user)
    doctor = appt.doctor
    start_local = validate_slot(db, doctor, data.start_time)
    appt.start_time = start_local
    appt.end_time = start_local + timedelta(minutes=doctor.consultation_minutes)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, SLOT_TAKEN)
    db.refresh(appt)
    return appt


def get_booked_or_404(db: Session, appt_id: int) -> Appointment:
    appt = db.get(Appointment, appt_id)
    if not appt:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    if appt.status != AppointmentStatus.booked:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Appointment is already {appt.status.value}")
    return appt


@router.patch("/{appt_id}/check-in", response_model=AppointmentOut)
def check_in(
    appt_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.staff, Role.admin)),
):
    appt = get_booked_or_404(db, appt_id)
    if appt.checked_in_at:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Patient is already checked in")
    if appt.start_time.astimezone(CLINIC_TZ).date() != now_local().date():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Check-in is only possible on the day of the appointment")
    appt.checked_in_at = now_local()
    db.commit()
    db.refresh(appt)
    return appt


@router.patch("/{appt_id}/complete", response_model=AppointmentOut)
def complete(
    appt_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.staff, Role.admin)),
):
    appt = get_booked_or_404(db, appt_id)
    if not appt.checked_in_at:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Check the patient in first")
    appt.status = AppointmentStatus.completed
    db.commit()
    db.refresh(appt)
    return appt


@router.patch("/{appt_id}/no-show", response_model=AppointmentOut)
def no_show(
    appt_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.staff, Role.admin)),
):
    appt = get_booked_or_404(db, appt_id)
    if appt.checked_in_at:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Patient has already checked in")
    if appt.start_time > now_local():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot mark no-show before the appointment time")
    appt.status = AppointmentStatus.no_show
    db.commit()
    db.refresh(appt)
    return appt

@router.get("/{appt_id}", response_model=AppointmentOut)
def get_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    appt = db.get(Appointment, appt_id)
    if not appt:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    if user.role == Role.patient and appt.patient_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    if user.role == Role.doctor:
        profile = db.scalar(select(DoctorProfile).where(DoctorProfile.user_id == user.id))
        if not profile or appt.doctor_id != profile.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")
    return appt