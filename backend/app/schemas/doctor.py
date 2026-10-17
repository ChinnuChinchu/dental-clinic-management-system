import datetime as dt

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DoctorCreateIn(BaseModel):
    user_id: int
    specialization: str = Field(min_length=2, max_length=120)
    qualification: str | None = None
    consultation_minutes: int = Field(default=30, ge=10, le=120)


class DoctorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    full_name: str
    specialization: str
    qualification: str | None
    consultation_minutes: int
    is_active: bool


class WorkingHoursIn(BaseModel):
    weekday: int = Field(ge=0, le=6)  # 0 = Monday
    start_time: dt.time
    end_time: dt.time

    @model_validator(mode="after")
    def check_order(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class WorkingHoursOut(WorkingHoursIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class LeaveIn(BaseModel):
    start_date: dt.date
    end_date: dt.date
    reason: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def check_order(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class LeaveOut(LeaveIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SlotsOut(BaseModel):
    doctor_id: int
    date: dt.date
    slots: list[dt.datetime]