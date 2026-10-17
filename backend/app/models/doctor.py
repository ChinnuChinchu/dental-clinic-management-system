from datetime import date, time

from sqlalchemy import (
    Boolean, CheckConstraint, Date, ForeignKey, Integer, String, Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import User


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    specialization: Mapped[str] = mapped_column(String(120))
    qualification: Mapped[str | None] = mapped_column(String(255), nullable=True)
    consultation_minutes: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped[User] = relationship()

    @property
    def full_name(self) -> str:
        return self.user.full_name
    
    @property
    def email(self) -> str:
        return self.user.email

    @property
    def phone(self) -> str | None:
        return self.user.phone


class WorkingHours(Base):
    """One row = one working window. Split shifts = two rows for the same weekday."""
    __tablename__ = "working_hours"
    __table_args__ = (
        CheckConstraint("weekday BETWEEN 0 AND 6", name="ck_weekday_range"),
        CheckConstraint("end_time > start_time", name="ck_end_after_start"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctor_profiles.id"), index=True)
    weekday: Mapped[int] = mapped_column(Integer)  # 0 = Monday ... 6 = Sunday
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)


class DoctorLeave(Base):
    __tablename__ = "doctor_leaves"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_leave_dates"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctor_profiles.id"), index=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)