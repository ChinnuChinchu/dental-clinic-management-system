# Dental Clinic Management System

FastAPI + PostgreSQL backend, React frontend.

## Backend setup
```bash
docker compose up -d
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements-dev.txt
copy .env.example .env      # then edit values
alembic upgrade head
python create_admin.py
uvicorn app.main:app --reload --port 8001
```

## Tests
```bash
cd backend && pytest -v
```

## Frontend
```bash
cd frontend && npm install && npm run dev
```