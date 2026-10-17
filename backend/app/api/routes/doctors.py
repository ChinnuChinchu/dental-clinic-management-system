from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.doctor import DoctorLeave, DoctorProfile, WorkingHours
from app.models.user import Role, User
from app.schemas.doctor import (
    DoctorCreateIn, DoctorOut, LeaveIn, LeaveOut, SlotsOut,
    WorkingHoursIn, WorkingHoursOut,
)
from app.services.slots import day_in_booking_range, get_available_slots

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


def get_doctor_or_404(db: Session, doctor_id: int) -> DoctorProfile:
    doctor = db.get(DoctorProfile, doctor_id)
    if not doctor:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Doctor not found")
    return doctor


def ensure_can_manage(doctor: DoctorProfile, user: User) -> None:
    """Admin can manage any doctor; a doctor can manage only their own schedule."""
    if user.role == Role.admin:
        return
    if user.role == Role.doctor and doctor.user_id == user.id:
        return
    raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")


# ---------- Public ----------

@router.get("", response_model=list[DoctorOut])
def list_doctors(db: Session = Depends(get_db)):
    return db.scalars(
        select(DoctorProfile).where(DoctorProfile.is_active.is_(True)).order_by(DoctorProfile.id)
    ).all()


@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return get_doctor_or_404(db, doctor_id)


@router.get("/{doctor_id}/working-hours", response_model=list[WorkingHoursOut])
def get_working_hours(doctor_id: int, db: Session = Depends(get_db)):
    get_doctor_or_404(db, doctor_id)
    return db.scalars(
        select(WorkingHours)
        .where(WorkingHours.doctor_id == doctor_id)
        .order_by(WorkingHours.weekday, WorkingHours.start_time)
    ).all()


@router.get("/{doctor_id}/slots", response_model=SlotsOut)
def get_slots(
    doctor_id: int,
    day: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
):
    doctor = get_doctor_or_404(db, doctor_id)
    if not day_in_booking_range(day):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Date is outside the booking window")
    return SlotsOut(doctor_id=doctor.id, date=day, slots=get_available_slots(db, doctor, day))


# ---------- Admin ----------

@router.post("", response_model=DoctorOut, status_code=201)
def create_doctor(
    data: DoctorCreateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.admin)),
):
    """Create the profile for a user that already has the doctor role."""
    user = db.get(User, data.user_id)
    if not user or user.role != Role.doctor:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "User must exist and have the doctor role"
        )
    if db.scalar(select(DoctorProfile).where(DoctorProfile.user_id == data.user_id)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Doctor profile already exists")

    doctor = DoctorProfile(**data.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


# ---------- Admin or the doctor themselves ----------

@router.put("/{doctor_id}/working-hours", response_model=list[WorkingHoursOut])
def set_working_hours(
    doctor_id: int,
    data: list[WorkingHoursIn],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Replaces the whole weekly schedule."""
    doctor = get_doctor_or_404(db, doctor_id)
    ensure_can_manage(doctor, user)

    last_end = {}
    for w in sorted(data, key=lambda w: (w.weekday, w.start_time)):
        prev = last_end.get(w.weekday)
        if prev and w.start_time < prev:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Working windows overlap")
        last_end[w.weekday] = w.end_time

    db.execute(delete(WorkingHours).where(WorkingHours.doctor_id == doctor_id))
    rows = [WorkingHours(doctor_id=doctor_id, **w.model_dump()) for w in data]
    db.add_all(rows)
    db.commit()
    return db.scalars(
        select(WorkingHours)
        .where(WorkingHours.doctor_id == doctor_id)
        .order_by(WorkingHours.weekday, WorkingHours.start_time)
    ).all()


@router.get("/{doctor_id}/leaves", response_model=list[LeaveOut])
def list_leaves(
    doctor_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(Role.admin, Role.staff, Role.doctor)),
):
    get_doctor_or_404(db, doctor_id)
    return db.scalars(
        select(DoctorLeave).where(DoctorLeave.doctor_id == doctor_id).order_by(DoctorLeave.start_date)
    ).all()


@router.post("/{doctor_id}/leaves", response_model=LeaveOut, status_code=201)
def add_leave(
    doctor_id: int,
    data: LeaveIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    doctor = get_doctor_or_404(db, doctor_id)
    ensure_can_manage(doctor, user)
    leave = DoctorLeave(doctor_id=doctor_id, **data.model_dump())
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


@router.delete("/{doctor_id}/leaves/{leave_id}", status_code=204)
def delete_leave(
    doctor_id: int,
    leave_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    doctor = get_doctor_or_404(db, doctor_id)
    ensure_can_manage(doctor, user)
    leave = db.get(DoctorLeave, leave_id)
    if not leave or leave.doctor_id != doctor_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave not found")
    db.delete(leave)
    db.commit()