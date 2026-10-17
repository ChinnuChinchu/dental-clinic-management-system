import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { btn, btnGhost, card, input } from '../../components/ui'
import { addDays, formatDay, formatTime, todayIST } from '../../utils/date'

function chip(a) {
  if (a.status === 'booked' && a.checked_in_at) return ['Waiting for you', 'bg-wave/30 text-lagoon']
  return {
    booked: ['Not arrived', 'bg-green-100 text-green-700'],
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

export default function DoctorHome() {
  const { user } = useAuth()
  const today = todayIST()
  const [date, setDate] = useState(today)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/appointments', { params: { date } })
      setItems(data)
      setError('')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { setLoading(true); load() }, [load])

  // Check-ins happen at the desk, so refresh to show newly arrived patients
  useEffect(() => {
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  const stats = useMemo(() => ({
    total: items.filter((a) => a.status !== 'cancelled').length,
    waiting: items.filter((a) => a.status === 'booked' && a.checked_in_at).length,
    done: items.filter((a) => a.status === 'completed').length,
  }), [items])

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Hello, {user.full_name} 👋</h1>
      <p className="mb-5 text-lagoon/60">{formatDay(date)}{date === today && ' (today)'}</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setDate(addDays(date, -1))} className={btnGhost} aria-label="Previous day">←</button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)}
          className={`${input} w-auto`} />
        <button onClick={() => setDate(addDays(date, 1))} className={btnGhost} aria-label="Next day">→</button>
        {date !== today && <button onClick={() => setDate(today)} className={btnGhost}>Today</button>}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Appointments" value={stats.total} />
        <Stat label="Waiting" value={stats.waiting} />
        <Stat label="Completed" value={stats.done} />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-lagoon/60">Loading…</p>
      ) : items.length === 0 ? (
        <p className={`${card} text-center text-lagoon/60`}>No appointments on this day.</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const [label, color] = chip(a)
            const waiting = a.status === 'booked' && a.checked_in_at
            return (
              <div key={a.id}
                className={`${card} flex flex-wrap items-center justify-between gap-3 py-3 ${
                  waiting ? 'border-wave ring-1 ring-wave' : ''} ${a.status === 'cancelled' ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <p className="w-20 text-lg font-bold text-wave-dark">{formatTime(a.start_time)}</p>
                  <div>
                    <p className="font-medium">{a.patient_name}</p>
                    {a.reason && <p className="text-sm text-lagoon/60">{a.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs ${color}`}>{label}</span>
                  {waiting && <Link to={`/doctor/visit/${a.id}`} className={btn}>Start visit</Link>}
                  {a.status === 'completed' && (
                    <Link to={`/doctor/visit/${a.id}`} className={btnGhost}>View / edit</Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}