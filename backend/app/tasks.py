import logging

from app.db.session import SessionLocal
from app.services import reminders
from app.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.run_reminders")
def run_reminders() -> dict:
    db = SessionLocal()
    try:
        result = reminders.run_all(db)
    finally:
        db.close()
    logger.info("Reminder run: %s", result)
    return result