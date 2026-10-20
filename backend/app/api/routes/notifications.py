from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.notification import Notification, NotificationStatus
from app.models.user import Role
from app.schemas.notification import NotificationOut
from app.services import reminders

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut],
            dependencies=[Depends(require_roles(Role.admin, Role.staff))])
def list_notifications(
    status_filter: NotificationStatus | None = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(Notification).order_by(Notification.id.desc()).limit(limit)
    if status_filter:
        stmt = stmt.where(Notification.status == status_filter)
    return db.scalars(stmt).all()


@router.post("/run", dependencies=[Depends(require_roles(Role.admin))])
def run_now(db: Session = Depends(get_db)):
    """Runs the same job the scheduler runs. Handy for demos and for checking the setup."""
    return reminders.run_all(db)