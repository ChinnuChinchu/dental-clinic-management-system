from datetime import timedelta

from app.services.slots import now_local


def get_slots(client, doctor_id, day):
    return client.get(f"/api/doctors/{doctor_id}/slots", params={"date": day.isoformat()})


def test_list_doctors_is_public(client, doctor):
    r = client.get("/api/doctors")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_slots_generated_from_working_hours(client, doctor, tomorrow):
    r = get_slots(client, doctor["id"], tomorrow)
    assert r.status_code == 200
    times = [s[11:16] for s in r.json()["slots"]]
    assert times == ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"]


def test_leave_removes_all_slots(client, doctor, admin_headers, tomorrow):
    r = client.post(f"/api/doctors/{doctor['id']}/leaves", headers=admin_headers, json={
        "start_date": tomorrow.isoformat(), "end_date": tomorrow.isoformat(), "reason": "Conference",
    })
    assert r.status_code == 201
    assert get_slots(client, doctor["id"], tomorrow).json()["slots"] == []


def test_date_outside_booking_window_rejected(client, doctor):
    far = now_local().date() + timedelta(days=200)
    assert get_slots(client, doctor["id"], far).status_code == 400


def test_patient_cannot_set_working_hours(client, doctor, patient):
    r = client.put(f"/api/doctors/{doctor['id']}/working-hours", headers=patient["headers"], json=[])
    assert r.status_code == 403


def test_doctor_can_update_own_hours(client, doctor, tomorrow):
    r = client.put(f"/api/doctors/{doctor['id']}/working-hours", headers=doctor["headers"], json=[
        {"weekday": tomorrow.weekday(), "start_time": "09:00", "end_time": "10:00"},
    ])
    assert r.status_code == 200
    times = [s[11:16] for s in get_slots(client, doctor["id"], tomorrow).json()["slots"]]
    assert times == ["09:00", "09:30"]


def test_overlapping_working_hours_rejected(client, doctor):
    r = client.put(f"/api/doctors/{doctor['id']}/working-hours", headers=doctor["headers"], json=[
        {"weekday": 0, "start_time": "10:00", "end_time": "13:00"},
        {"weekday": 0, "start_time": "12:00", "end_time": "15:00"},
    ])
    assert r.status_code == 400