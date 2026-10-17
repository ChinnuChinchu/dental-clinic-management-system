import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../api/client'
import { formatDateTime } from '../utils/date'

const badge = {
  booked: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-700',
  no_show: 'bg-red-100 text-red-700',
}

export default function MyAppointments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/appointments/mine')
      setItems(data)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const cancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    setError('')
    try {
      await api.patch(`/api/appointments/${id}/cancel`)
      load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (loading) return <p className="text-gray-500">Loading…</p>

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">My appointments</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {items.length === 0 && <p className="text-gray-500">You have no appointments yet.</p>}
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
            <div>
              <p className="font-medium">{formatDateTime(a.start_time)}</p>
              <p className="text-sm text-gray-600">{a.doctor_name}</p>
              {a.reason && <p className="text-sm text-gray-400">{a.reason}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2 py-1 text-xs ${badge[a.status]}`}>{a.status}</span>
              {a.status === 'booked' && (
                <button onClick={() => cancel(a.id)} className="text-sm text-red-600 hover:underline">
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}