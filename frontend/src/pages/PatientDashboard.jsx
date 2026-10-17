import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { card } from '../components/ui'
import { formatDate, formatDateTime, todayIST } from '../utils/date'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [followUp, setFollowUp] = useState(null)

  useEffect(() => {
    api.get('/api/appointments/mine')
      .then((r) => setItems(r.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
  api.get('/api/visits/mine')
    .then((r) => {
      const today = todayIST()
      const dates = r.data.map((v) => v.follow_up_date).filter((d) => d && d >= today).sort()
      setFollowUp(dates[0] || null)
    })
    .catch(() => {})
}, [])

  const now = Date.now()
  const upcoming = items
    .filter((a) => a.status === 'booked' && new Date(a.start_time) > now)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const next = upcoming[0]
  const past = items.filter((a) => !upcoming.includes(a)).slice(0, 3)

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Hello, {user.full_name.split(' ')[0]} 👋</h1>
      <p className="mb-6 text-lagoon/60">Here is what's happening with your dental care.</p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Next appointment */}
      <section className="mb-6 overflow-hidden rounded-3xl bg-lagoon p-6 text-silk shadow-lg">
        <p className="text-sm text-silk/60">Next appointment</p>
        {loading ? (
          <p className="mt-2">Loading…</p>
        ) : next ? (
          <>
            <p className="mt-1 text-2xl font-bold text-wave">{formatDateTime(next.start_time)}</p>
            <p className="mt-1 text-silk/80">with {next.doctor_name}</p>
            {next.reason && <p className="text-sm text-silk/60">{next.reason}</p>}
            <Link to="/my-appointments" className="mt-4 inline-block rounded-full border border-silk/40 px-4 py-1.5 text-sm hover:bg-white/10">
              Manage
            </Link>
          </>
        ) : (
          <>
            <p className="mt-1 text-lg">You have nothing booked.</p>
            <Link to="/doctors" className="mt-4 inline-block rounded-full bg-wave px-5 py-2 text-sm font-semibold text-lagoon hover:bg-wave-dark">
              Book an appointment
            </Link>
          </>
        )}
      </section>

      {followUp && (
        <section className={`${card} mb-6 flex flex-wrap items-center justify-between gap-3 border-wave`}>
          <div>
            <p className="text-sm text-lagoon/60">Next checkup due</p>
            <p className="text-lg font-semibold">🔔 {formatDate(followUp)}</p>
          </div>
          <Link to="/doctors" className="rounded-full bg-wave px-5 py-2 text-sm font-semibold text-lagoon hover:bg-wave-dark">
            Book it now
          </Link>
        </section>
      )}

      {/* Quick actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link to="/doctors" className={`${card} transition hover:-translate-y-1 hover:shadow-lg`}>
          <p className="text-2xl">📅</p>
          <p className="mt-2 font-semibold">Book appointment</p>
          <p className="text-sm text-lagoon/60">Choose a doctor and a time</p>
        </Link>
        <Link to="/my-appointments" className={`${card} transition hover:-translate-y-1 hover:shadow-lg`}>
          <p className="text-2xl">📋</p>
          <p className="mt-2 font-semibold">My appointments</p>
          <p className="text-sm text-lagoon/60">{upcoming.length} upcoming · cancel or review</p>
        </Link>
      </div>

      {/* Recent history */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Recent visits</h2>
          <div className="space-y-2">
            {past.map((a) => (
              <div key={a.id} className={`${card} flex items-center justify-between py-3`}>
                <div>
                  <p className="text-sm font-medium">{formatDateTime(a.start_time)}</p>
                  <p className="text-xs text-lagoon/60">{a.doctor_name}</p>
                </div>
                <span className="rounded-full bg-silk px-2 py-0.5 text-xs">{a.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}