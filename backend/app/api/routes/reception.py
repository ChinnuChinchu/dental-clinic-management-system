import secrets
from fastapi import HTTPException
from fastapi import APIRouter, Depends
from sqlalchemy import Date, cast, exists, func, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.config import settings
from app.core.security import hash_password
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import DoctorLeave
from app.models.user import Role, User
from app.schemas.appointment import AppointmentOut
from app.schemas.reception import WalkInPatientIn
from app.schemas.user import UserOut
from app.services.slots import now_local
from app.core.constants import WALKIN_EMAIL_DOMAIN as WALKIN_DOMAIN

router = APIRouter(
    prefix="/api/reception",
    tags=["reception"],
    dependencies=[Depends(require_roles(Role.staff, Role.admin))],
)




@router.post("/patients", response_model=UserOut, status_code=201)
def create_walk_in_patient(data: WalkInPatientIn, db: Session = Depends(get_db)):
    """Register a patient at the desk. No email means a placeholder address and an
    unusable random password, so the record exists but nobody can log in to it."""
    email = data.email.lower() if data.email else f"walkin-{secrets.token_hex(6)}@{WALKIN_DOMAIN}"
    if db.scalar(select(User).where(User.email == email)):
        
        raise HTTPException(409, "Email already registered. Search for the patient instead.")

    user = User(
        full_name=data.full_name,
        email=email,
        phone=data.phone,
        hashed_password=hash_password(secrets.token_urlsafe(32)),
        role=Role.patient,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/affected-by-leave", response_model=list[AppointmentOut])
def affected_by_leave(db: Session = Depends(get_db)):
    """Upcoming booked appointments that fall on a day the doctor is on leave."""
    local_day = cast(func.timezone(settings.CLINIC_TIMEZONE, Appointment.start_time), Date)
    on_leave = exists().where(
        DoctorLeave.doctor_id == Appointment.doctor_id,
        DoctorLeave.start_date <= local_day,
        DoctorLeave.end_date >= local_day,
    )
    return db.scalars(
        select(Appointment)
        .where(
            Appointment.status == AppointmentStatus.booked,
            Appointment.start_time > now_local(),
            on_leave,
        )
        .order_by(Appointment.start_time)
    ).all()