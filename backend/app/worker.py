from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery("clinic", broker=settings.REDIS_URL, include=["app.tasks"])
celery_app.conf.update(
    timezone=settings.CLINIC_TIMEZONE,
    broker_connection_retry_on_startup=True,
    beat_schedule={
        "run-reminders": {
            "task": "app.tasks.run_reminders",
            "schedule": crontab(minute="*/15"),  # :00, :15, :30, :45
        },
    },
)