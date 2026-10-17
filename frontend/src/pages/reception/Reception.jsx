import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { errorMessage } from '../../api/client'
import { btn, btnGhost, card, input } from '../../components/ui'
import { addDays, formatDateTime, formatDay, formatTime, todayIST } from '../../utils/date'
import RescheduleModal from './RescheduleModal'
import WalkInModal from './WalkInModal'

function statusChip(a) {
  if (a.status === 'booked' && a.checked_in_at) return ['In clinic', 'bg-wave/30 text-lagoon']
  return {
    booked: ['Booked', 'bg-green-100 text-green-700'],
    completed: ['Completed', 'bg-blue-100 text-blue-700'],
    no_show: ['No-show', 'bg-red-100 text-red-700'],
    cancelled: ['Cancelled', 'bg-gray-100 text-gray-500'],
  }[a.status]
}

function Stat({ label, value }) {
  return (
    <div className={`${card} py-4 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-lagoon/60">{label}</p>
    </div>
  )
}

export default function Reception() {
  const today = todayIST()
  const [date, setDate] = useState(today)
  const [doctorId, setDoctorId] = useState('')
  const [doctors, setDoctors] = useState([])
  const [items, setItems] = useState([])
  const [affected, setAffected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [walkIn, setWalkIn] = useState(false)
  const [resched, setResched] = useState(null)

  useEffect(() => {
    api.get('/api/doctors').then((r) => setDoctors(r.data)).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    try {
      const params = { date }
      if (doctorId) params.doctor_id = doctorId
      const [a, l] = await Promise.all([
        api.get('/api/appointments', { params }),
        api.get('/api/reception/affected-by-leave'),
      ])
      setItems(a.data)
      setAffected(l.data)
      setError('')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [date, doctorId])

  useEffect(() => { setLoading(true); load() }, [load])

  // Refresh every 30 seconds so the desk sees online bookings arrive
  useEffect(() => {
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  const act = async (id, action, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return
    setError('')
    try {
      await api.patch(`/api/appointments/${id}/${action}`)
      load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const stats = useMemo(() => ({
    total: items.filter((a) => a.status !== 'cancelled').length,
    waiting: items.filter((a) => a.status === 'booked' && !a.checked_in_at).length,
    inClinic: items.filter((a) => a.status === 'booked' && a.checked_in_at).length,
    done: items.filter((a) => a.status === 'completed').length,
    missed: items.filter((a) => a.status === 'no_show').length,
  }), [items])

  const now = Date.now()

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reception</h1>
        <button onClick={() => setWalkIn(true)} className={btn}>+ Book for a patient</button>
      </div>

      {affected.length > 0 && (
        <section className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">
            ⚠️ {affected.length} booking{affected.length > 1 ? 's' : ''} on a doctor's leave day
          </h2>
          <p className="mb-3 text-xs text-amber-800">Contact these patients, then move or cancel the booking.</p>
          <ul className="space-y-2">
            {affected.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                <span>
                  <b>{a.patient_name}</b>{a.patient_phone && ` · ${a.patient_phone}`}
                  <span className="text-lagoon/60"> · {formatDateTime(a.start_time)} · {a.doctor_name}</span>
                </span>
                <span className="flex gap-2">
                  <button onClick={() => setResched(a)} className={btnGhost}>Reschedule</button>
                  <button onClick={() => act(a.id, 'cancel', `Cancel ${a.patient_name}'s appointment?`)}
                    className="text-red-600 hover:underline">Cancel</button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Date and doctor filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setDate(addDays(date, -1))} className={btnGhost} aria-label="Previous day">←</button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)}
          className={`${input} w-auto`} />
        <button onClick={() => setDate(addDays(date, 1))} className={btnGhost} aria-label="Next day">→</button>
        {date !== today && <button onClick={() => setDate(today)} className={btnGhost}>Today</button>}
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={`${input} ml-auto w-auto`}>
          <option value="">All doctors</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
        </select>
      </div>
      <p className="mb-4 font-medium">{formatDay(date)}{date === today && ' (today)'}</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Appointments" value={stats.total} />
        <Stat label="Waiting" value={stats.waiting} />
        <Stat label="In clinic" value={stats.inClinic} />
        <Stat label="Completed" value={stats.done} />
        <Stat label="No-show" value={stats.missed} />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-lagoon/60">Loading…</p>
      ) : items.length === 0 ? (
        <p className={`${card} text-center text-lagoon/60`}>No appointments on this day.</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const [label, color] = statusChip(a)
            const open = a.status === 'booked'
            const started = new Date(a.start_time) <= now
            return (
              <div key={a.id} className={`${card} flex flex-wrap items-center justify-between gap-3 py-3 ${a.status === 'cancelled' ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <p className="w-20 text-lg font-bold text-wave-dark">{formatTime(a.start_time)}</p>
                  <div>
                    <p className="font-medium">{a.patient_name}
                      {a.patient_phone && <span className="font-normal text-lagoon/60"> · {a.patient_phone}</span>}
                    </p>
                    <p className="text-sm text-lagoon/60">{a.doctor_name}{a.reason && ` · ${a.reason}`}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs ${color}`}>{label}</span>
                  {open && !a.checked_in_at && date === today && (
                    <button onClick={() => act(a.id, 'check-in')} className={btn}>Check in</button>
                  )}
                  {open && a.checked_in_at && (
                    <button onClick={() => act(a.id, 'complete')} className={btn}>Complete</button>
                  )}
                  {open && !a.checked_in_at && (
                    <>
                      {started && (
                        <button onClick={() => act(a.id, 'no-show', `Mark ${a.patient_name} as no-show?`)}
                          className={btnGhost}>No-show</button>
                      )}
                      <button onClick={() => setResched(a)} className={btnGhost}>Reschedule</button>
                      <button onClick={() => act(a.id, 'cancel', `Cancel ${a.patient_name}'s appointment?`)}
                        className="text-sm text-red-600 hover:underline">Cancel</button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {walkIn && (
        <WalkInModal doctors={doctors} onClose={() => setWalkIn(false)}
          onDone={() => { setWalkIn(false); load() }} />
      )}
      {resched && (
        <RescheduleModal appointment={resched} onClose={() => setResched(null)}
          onDone={() => { setResched(null); load() }} />
      )}
    </div>
  )
}