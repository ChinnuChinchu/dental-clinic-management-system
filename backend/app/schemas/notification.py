from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.notification import NotificationChannel, NotificationKind, NotificationStatus


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    patient_name: str
    recipient: str
    kind: NotificationKind
    channel: NotificationChannel
    status: NotificationStatus
    subject: str
    body: str
    attempts: int
    error: str | None
    sent_at: datetime | None
    created_at: datetime