from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin,appointments, auth, doctors,notifications,reception, users,visits

app = FastAPI(title="Dental Clinic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(reception.router)
app.include_router(visits.router)
app.include_router(notifications.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}