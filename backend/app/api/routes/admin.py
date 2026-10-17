from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.security import hash_password
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import DoctorProfile
from app.models.user import Role, User
from app.schemas.admin import AdminDoctorOut, DoctorAccountCreateIn, DoctorUpdateIn
from app.services.slots import now_local

# Every route in this file is admin-only.
router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_roles(Role.admin))],
)


@router.get("/doctors", response_model=list[AdminDoctorOut])
def list_all_doctors(db: Session = Depends(get_db)):
    """Includes inactive doctors, unlike the public /api/doctors."""
    return db.scalars(select(DoctorProfile).order_by(DoctorProfile.id)).all()


@router.post("/doctors", response_model=AdminDoctorOut, status_code=201)
def create_doctor_with_account(data: DoctorAccountCreateIn, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        full_name=data.full_name,
        email=email,
        phone=data.phone,
        hashed_password=hash_password(data.password),
        role=Role.doctor,
    )
    db.add(user)
    db.flush()  # gets user.id without committing yet

    profile = DoctorProfile(
        user_id=user.id,
        specialization=data.specialization,
        qualification=data.qualification,
        consultation_minutes=data.consultation_minutes,
    )
    db.add(profile)
    try:
        db.commit()  # account + profile are saved together, or not at all
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    db.refresh(profile)
    return profile


@router.patch("/doctors/{doctor_id}", response_model=AdminDoctorOut)
def update_doctor(doctor_id: int, data: DoctorUpdateIn, db: Session = Depends(get_db)):
    doctor = db.get(DoctorProfile, doctor_id)
    if not doctor:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Doctor not found")

    changes = data.model_dump(exclude_unset=True)
    # Only qualification may be cleared; the other fields can't be null.
    changes = {k: v for k, v in changes.items() if v is not None or k == "qualification"}

    new_minutes = changes.get("consultation_minutes")
    if new_minutes is not None and new_minutes != doctor.consultation_minutes:
        upcoming = db.scalar(
            select(func.count()).select_from(Appointment).where(
                Appointment.doctor_id == doctor.id,
                Appointment.status == AppointmentStatus.booked,
                Appointment.start_time > now_local(),
            )
        )
        if upcoming:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Cannot change visit duration while {upcoming} upcoming booking(s) exist. "
                "Cancel or complete them first.",
            )

    is_active = changes.pop("is_active", None)
    for field, value in changes.items():
        setattr(doctor, field, value)
    if is_active is not None:
        doctor.is_active = is_active
        doctor.user.is_active = is_active  # a deactivated doctor can't log in either

    db.commit()
    db.refresh(doctor)
    return doctor