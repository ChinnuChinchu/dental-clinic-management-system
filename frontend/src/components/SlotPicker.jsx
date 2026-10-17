import { useEffect, useState } from 'react'
import api, { errorMessage } from '../api/client'
import { addDays, formatTime, todayIST } from '../utils/date'

export default function SlotPicker({ doctorId, value, onChange }) {
  const today = todayIST()
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    onChange(null)
    if (!doctorId) { setSlots([]); return }
    let cancelled = false
    setLoading(true)
    setError('')
    api.get(`/api/doctors/${doctorId}/slots`, { params: { date } })
      .then((r) => !cancelled && setSlots(r.data.slots))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date])

  return (
    <div>
      <input
        type="date" value={date} min={today} max={addDays(today, 60)}
        onChange={(e) => setDate(e.target.value)}
        className="mb-3 rounded-xl border border-lagoon/20 bg-white px-3 py-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-lagoon/60">Loading…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-lagoon/60">No free slots on this date.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((s) => (
            <button
              type="button" key={s} onClick={() => onChange(s)}
              className={`rounded border px-2 py-1.5 text-sm ${
                value === s ? 'border-wave bg-wave font-medium text-lagoon' : 'bg-white hover:border-wave'
              }`}
            >
              {formatTime(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}