from pydantic import BaseModel, EmailStr, Field

from app.schemas.doctor import DoctorOut


class DoctorAccountCreateIn(BaseModel):
    """Everything needed to onboard a doctor in one request."""
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=8, max_length=72)
    specialization: str = Field(min_length=2, max_length=120)
    qualification: str | None = None
    consultation_minutes: int = Field(default=30, ge=10, le=120)


class DoctorUpdateIn(BaseModel):
    specialization: str | None = Field(default=None, min_length=2, max_length=120)
    qualification: str | None = None
    consultation_minutes: int | None = Field(default=None, ge=10, le=120)
    is_active: bool | None = None


class AdminDoctorOut(DoctorOut):
    email: str
    phone: str | None