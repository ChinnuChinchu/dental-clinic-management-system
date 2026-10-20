from app.core.config import settings
from app.models.appointment import Appointment
from app.models.user import User
from app.models.visit import Visit
from app.services.slots import CLINIC_TZ

# Deliberately no diagnosis or treatment details: email is not a safe place for them.


def appointment_message(appt: Appointment) -> tuple[str, str]:
    start = appt.start_time.astimezone(CLINIC_TZ)
    first = appt.patient.full_name.split()[0]
    subject = f"Appointment reminder: {start:%d %b} at {start:%I:%M %p}"
    body = (
        f"Hello {first},\n\n"
        f"This is a reminder of your appointment at {settings.CLINIC_NAME}.\n\n"
        f"Doctor: {appt.doctor.user.full_name}\n"
        f"Date: {start:%A, %d %B %Y}\n"
        f"Time: {start:%I:%M %p}\n"
        f"Place: {settings.CLINIC_ADDRESS}\n\n"
        f"Need to change it? Log in at {settings.FRONTEND_URL} to cancel or reschedule "
        f"(up to {settings.CANCEL_CUTOFF_HOURS} hours before), or call us on {settings.CLINIC_PHONE}.\n\n"
        f"See you soon,\n{settings.CLINIC_NAME}"
    )
    return subject, body


def followup_message(user: User, visit: Visit) -> tuple[str, str]:
    first = user.full_name.split()[0]
    due = visit.follow_up_date
    subject = f"Time for your dental checkup ({due:%d %b %Y})"
    body = (
        f"Hello {first},\n\n"
        f"Your next dental checkup at {settings.CLINIC_NAME} is due around {due:%d %B %Y}.\n\n"
        f"Book a time that suits you at {settings.FRONTEND_URL}/doctors "
        f"or call us on {settings.CLINIC_PHONE}.\n\n"
        f"Regular checkups catch problems early.\n\n"
        f"{settings.CLINIC_NAME}"
    )
    return subject, body