from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class VisitIn(BaseModel):
    diagnosis: str | None = Field(default=None, max_length=2000)
    treatment_done: str | None = Field(default=None, max_length=2000)
    prescription: str | None = Field(default=None, max_length=2000)
    notes: str | None = Field(default=None, max_length=4000)
    follow_up_date: date | None = None
    mark_completed: bool = False


class PatientVisitOut(BaseModel):
    """What a patient may see. No private notes."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    appointment_id: int
    doctor_name: str
    start_time: datetime
    diagnosis: str | None
    treatment_done: str | None
    prescription: str | None
    follow_up_date: date | None


class VisitOut(PatientVisitOut):
    doctor_id: int
    patient_id: int
    notes: str | None