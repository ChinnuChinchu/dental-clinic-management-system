import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { errorMessage } from '../../api/client'
import { btn, btnGhost, card, input } from '../../components/ui'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function DoctorSchedule() {
  const { doctorId } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [hours, setHours] = useState([])
  const [leaves, setLeaves] = useState([])
  const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadLeaves = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/doctors/${doctorId}/leaves`)
      setLeaves(data)
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [doctorId])

  useEffect(() => {
    api.get(`/api/doctors/${doctorId}`).then((r) => setDoctor(r.data)).catch((e) => setError(errorMessage(e)))
    api.get(`/api/doctors/${doctorId}/working-hours`)
      .then((r) =>
        setHours(r.data.map((w) => ({
          weekday: w.weekday,
          start_time: w.start_time.slice(0, 5), // "10:00:00" -> "10:00"
          end_time: w.end_time.slice(0, 5),
        }))),
      )
      .catch((e) => setError(errorMessage(e)))
    loadLeaves()
  }, [doctorId, loadLeaves])

  const addWindow = (weekday) =>
    setHours([...hours, { weekday, start_time: '10:00', end_time: '13:00' }])

  const removeWindow = (index) => setHours(hours.filter((_, i) => i !== index))

  const changeWindow = (index, field, value) =>
    setHours(hours.map((h, i) => (i === index ? { ...h, [field]: value } : h)))

  // Same hours for Mon-Sat as Monday; Sunday is left untouched.
  const copyMonday = () => {
    const monday = hours.filter((h) => h.weekday === 0)
    const sunday = hours.filter((h) => h.weekday === 6)
    const rest = [1, 2, 3, 4, 5].flatMap((d) => monday.map((m) => ({ ...m, weekday: d })))
    setHours([...monday, ...rest, ...sunday])
  }

  const saveHours = async () => {
    setError('')
    setMessage('')
    setSaving(true)
    try {
      await api.put(`/api/doctors/${doctorId}/working-hours`, hours)
      setMessage('Working hours saved.')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const addLeave = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/api/doctors/${doctorId}/leaves`, {
        ...leaveForm,
        reason: leaveForm.reason || null,
      })
      setLeaveForm({ start_date: '', end_date: '', reason: '' })
      loadLeaves()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const removeLeave = async (id) => {
    if (!window.confirm('Remove this leave?')) return
    try {
      await api.delete(`/api/doctors/${doctorId}/leaves/${id}`)
      loadLeaves()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/doctors" className="text-sm underline">← Back to doctors</Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold">{doctor ? doctor.full_name : 'Schedule'}</h1>
      {doctor && (
        <p className="mb-6 text-sm text-gray-600">
          {doctor.specialization} · {doctor.consultation_minutes} min per visit
        </p>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mb-4 text-sm text-green-700">{message}</p>}

      <section className={`${card} mb-8`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Weekly working hours</h2>
          <button onClick={copyMonday} className={btnGhost}>Copy Monday to Tue–Sat</button>
        </div>

        <div className="space-y-4">
          {DAYS.map((day, d) => (
            <div key={day} className="flex flex-wrap items-start gap-3 border-b border-lagoon/10 pb-3 last:border-0">
              <div className="w-28 pt-2 text-sm font-medium">{day}</div>
              <div className="flex-1 space-y-2">
                {hours.every((h) => h.weekday !== d) && (
                  <p className="pt-2 text-sm text-gray-400">Closed</p>
                )}
                {hours.map((h, i) =>
                  h.weekday === d ? (
                    <div key={i} className="flex items-center gap-2">
                      <input type="time" value={h.start_time} className={`${input} w-auto`}
                        onChange={(e) => changeWindow(i, 'start_time', e.target.value)} />
                      <span>to</span>
                      <input type="time" value={h.end_time} className={`${input} w-auto`}
                        onChange={(e) => changeWindow(i, 'end_time', e.target.value)} />
                      <button onClick={() => removeWindow(i)} className="text-sm text-red-600 hover:underline">
                        Remove
                      </button>
                    </div>
                  ) : null,
                )}
              </div>
              <button onClick={() => addWindow(d)} className={btnGhost}>+ Add hours</button>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Add two windows on one day for a lunch break, for example 10:00–13:00 and 16:00–19:00.
        </p>
        <button onClick={saveHours} disabled={saving} className={`${btn} mt-4`}>
          {saving ? 'Saving…' : 'Save working hours'}
        </button>
      </section>

      <section className={card}>
        <h2 className="mb-1 font-semibold">Leave &amp; holidays</h2>
        <p className="mb-4 text-xs text-gray-500">
          Leave blocks new bookings on those dates. Appointments already booked are not cancelled automatically.
        </p>

        <form onSubmit={addLeave} className="mb-4 grid gap-2 sm:grid-cols-4">
          <input required type="date" className={input} value={leaveForm.start_date}
            onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} />
          <input required type="date" className={input} value={leaveForm.end_date} min={leaveForm.start_date}
            onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} />
          <input className={input} placeholder="Reason (optional)" value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
          <button className={btn}>Add leave</button>
        </form>

        {leaves.length === 0 && <p className="text-sm text-gray-500">No leave scheduled.</p>}
        <ul className="space-y-2">
          {leaves.map((l) => (
            <li key={l.id} className="flex items-center justify-between rounded border border-lagoon/10 px-3 py-2 text-sm">
              <span>
                {l.start_date === l.end_date ? l.start_date : `${l.start_date} → ${l.end_date}`}
                {l.reason && <span className="text-gray-500"> · {l.reason}</span>}
              </span>
              <button onClick={() => removeLeave(l.id)} className="text-red-600 hover:underline">Remove</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}