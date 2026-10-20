import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { btn, card } from '../components/ui'
import { formatDateTime } from '../utils/date'

const STATUS = {
  sent: ['Sent', 'bg-green-100 text-green-700'],
  pending: ['Pending', 'bg-amber-100 text-amber-800'],
  skipped: ['Skipped', 'bg-gray-100 text-gray-600'],
  failed: ['Failed', 'bg-red-100 text-red-700'],
}
const KIND = { appointment_reminder: 'Appointment reminder', followup_reminder: 'Checkup reminder' }
const TABS = [['all', 'All'], ['sent', 'Sent'], ['pending', 'Pending'], ['skipped', 'Skipped'], ['failed', 'Failed']]

export default function Notifications() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications', { params: { limit: 200 } })
      setItems(data)
      setError('')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const runNow = async () => {
    setRunning(true)
    setError('')
    setMessage('')
    try {
      const { data: r } = await api.post('/api/notifications/run')
      setMessage(
        `Created ${r.appointment_reminders_created} appointment and ${r.followup_reminders_created} checkup reminders. ` +
        `Sent ${r.sent}, retrying ${r.retrying}, failed ${r.failed}.`,
      )
      await load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setRunning(false)
    }
  }

  const counts = useMemo(() => {
    const c = { all: items.length, sent: 0, pending: 0, skipped: 0, failed: 0 }
    items.forEach((i) => { c[i.status] += 1 })
    return c
  }, [items])

  const visible = filter === 'all' ? items : items.filter((i) => i.status === filter)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reminders</h1>
        {user.role === 'admin' && (
          <button onClick={runNow} disabled={running} className={btn}>
            {running ? 'Running…' : 'Run reminders now'}
          </button>
        )}
      </div>
      <p className="mb-5 text-sm text-lagoon/60">
        Reminders go out automatically every 15 minutes. <b>Skipped</b> usually means the patient has no email, so call them.
      </p>

      {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === key ? 'bg-lagoon text-silk' : 'bg-white hover:bg-wave/30'}`}>
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-lagoon/60">Loading…</p>
      ) : visible.length === 0 ? (
        <p className={`${card} text-center text-lagoon/60`}>Nothing here yet.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => {
            const [label, color] = STATUS[n.status]
            return (
              <details key={n.id} className={`${card} py-3`}>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span>
                    <b>{n.patient_name}</b>
                    <span className="text-sm text-lagoon/60"> · {KIND[n.kind]} · {formatDateTime(n.created_at)}</span>
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs ${color}`}>{label}</span>
                </summary>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-lagoon/60">
                    To: {n.recipient || '(no email)'} · attempts: {n.attempts}
                    {n.sent_at && ` · sent ${formatDateTime(n.sent_at)}`}
                  </p>
                  {n.error && <p className="text-red-600">{n.error}</p>}
                  <p className="font-medium">{n.subject}</p>
                  <pre className="whitespace-pre-wrap rounded-xl bg-silk/50 p-3 font-sans text-lagoon/80">{n.body}</pre>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}