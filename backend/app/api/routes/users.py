from fastapi import APIRouter, Depends, HTTPException,Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import Role, User
from app.models.doctor import DoctorProfile
from app.schemas.user import StaffCreateIn, UserOut, UserUpdateIn

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    data: StaffCreateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.admin)),
):
    """Admin creates doctor / staff / admin accounts."""
    if db.scalar(select(User).where(User.email == data.email.lower())):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        full_name=data.full_name,
        email=data.email.lower(),
        phone=data.phone,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("", response_model=list[UserOut])
def list_users(
    role: Role | None = None,
    q: str | None = Query(None, min_length=2, max_length=60),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.admin, Role.staff)),
):
    """Staff search patients by name, email or phone using ?q=."""
    stmt = select(User).order_by(User.id)
    if role:
        stmt = stmt.where(User.role == role)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(User.full_name.ilike(like), User.email.ilike(like), User.phone.ilike(like))
        )
    return db.scalars(stmt.limit(limit)).all()

@router.patch("/{user_id}", response_model=UserOut)
def set_user_active(
    user_id: int,
    data: UserUpdateIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(Role.admin)),
):
    """Deactivate or reactivate an account. Nothing is deleted, so history stays intact."""
    if user_id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot deactivate your own account")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    user.is_active = data.is_active
    if user.role == Role.doctor:
        profile = db.scalar(select(DoctorProfile).where(DoctorProfile.user_id == user.id))
        if profile:
            profile.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user