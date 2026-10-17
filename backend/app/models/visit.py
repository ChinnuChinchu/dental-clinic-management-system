from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.appointment import Appointment
from app.models.doctor import DoctorProfile


class Visit(Base):
    """One clinical record per appointment."""
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(ForeignKey("appointments.id"), unique=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctor_profiles.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    treatment_done: Mapped[str | None] = mapped_column(Text, nullable=True)
    prescription: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)  # private: patients never see this
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    appointment: Mapped[Appointment] = relationship()
    doctor: Mapped[DoctorProfile] = relationship()

    @property
    def doctor_name(self) -> str:
        return self.doctor.user.full_name

    @property
    def start_time(self) -> datetime:
        return self.appointment.start_time