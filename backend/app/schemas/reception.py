from pydantic import BaseModel, EmailStr, Field


class WalkInPatientIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=20)
    email: EmailStr | None = None  # many walk-in patients have no email