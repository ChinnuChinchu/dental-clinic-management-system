from datetime import datetime

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from app.models.appointment import AppointmentStatus


class AppointmentCreateIn(BaseModel):
    doctor_id: int
    start_time: AwareDatetime  # e.g. 2026-10-19T10:00:00+05:30
    reason: str | None = Field(default=None, max_length=500)
    patient_id: int | None = None  # only used when staff/admin book for a patient


class RescheduleIn(BaseModel):
    start_time: AwareDatetime


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    doctor_name: str
    patient_id: int
    patient_name: str
    start_time: datetime
    end_time: datetime
    status: AppointmentStatus
    reason: str | None
    patient_phone: str | None
    checked_in_at: datetime | None