import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import User


class NotificationKind(str, enum.Enum):
    appointment_reminder = "appointment_reminder"
    followup_reminder = "followup_reminder"


class NotificationChannel(str, enum.Enum):
    email = "email"  # whatsapp / sms get added here later


class NotificationStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"    # gave up after all retries
    skipped = "skipped"  # not sent on purpose (see the error column)


def _enum(e):
    # Stored as plain text, so adding a channel later needs no ALTER TYPE migration.
    return Enum(e, native_enum=False, length=30)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id"), nullable=True)
    visit_id: Mapped[int | None] = mapped_column(ForeignKey("visits.id"), nullable=True)

    kind: Mapped[NotificationKind] = mapped_column(_enum(NotificationKind))
    channel: Mapped[NotificationChannel] = mapped_column(_enum(NotificationChannel))
    status: Mapped[NotificationStatus] = mapped_column(
        _enum(NotificationStatus), default=NotificationStatus.pending, index=True
    )

    # One reminder of one kind for one thing = one row. The unique key enforces it.
    dedupe_key: Mapped[str] = mapped_column(String(120), unique=True)

    recipient: Mapped[str] = mapped_column(String(255), default="")
    subject: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)

    attempts: Mapped[int] = mapped_column(Integer, default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship()

    @property
    def patient_name(self) -> str:
        return self.user.full_name