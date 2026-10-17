import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { errorMessage } from '../api/client'
import { addDays, formatTime, todayIST } from '../utils/date'

export default function BookAppointment() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const today = todayIST()

  const [doctor, setDoctor] = useState(null)
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState([])
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    api.get(`/api/doctors/${doctorId}`)
      .then((r) => setDoctor(r.data))
      .catch((e) => setError(errorMessage(e)))
  }, [doctorId])

  useEffect(() => {
    let cancelled = false
    setLoadingSlots(true)
    setSelected(null)
    api.get(`/api/doctors/${doctorId}/slots`, { params: { date } })
      .then((r) => !cancelled && setSlots(r.data.slots))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoadingSlots(false))
    return () => { cancelled = true }
  }, [doctorId, date, refreshKey])

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/appointments', {
        doctor_id: Number(doctorId),
        start_time: selected,
        reason: reason || null,
      })
      navigate('/my-appointments')
    } catch (e) {
      setError(errorMessage(e))
      if (e.response?.status === 409) setRefreshKey((k) => k + 1) // slot was taken: reload
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Book an appointment</h1>
      {doctor && (
        <p className="mb-6 text-gray-600">
          {doctor.full_name} · {doctor.specialization}
        </p>
      )}

      <label className="mb-1 block text-sm font-medium">Choose a date</label>
      <input
        type="date" value={date} min={today} max={addDays(today, 60)}
        onChange={(e) => { setError(''); setDate(e.target.value) }}
        className="mb-6 rounded border px-3 py-2"
      />

      <h2 className="mb-2 text-sm font-medium">Available times</h2>
      {loadingSlots ? (
        <p className="text-gray-500">Loading…</p>
      ) : slots.length === 0 ? (
        <p className="text-gray-500">No slots available on this date. Try another day.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((s) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`rounded border px-3 py-2 text-sm ${
                selected === s ? 'border-wave bg-wave font-medium text-lagoon' : 'bg-white hover:border-wave'
              }`}
            >
              {formatTime(s)}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-6 space-y-3">
          <textarea
            placeholder="Reason for visit (optional)" value={reason} maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded border px-3 py-2" rows={3}
          />
          <button
            onClick={submit} disabled={submitting}
            className="rounded bg-wave px-5 py-2 font-medium text-lagoon hover:bg-wave-dark disabled:opacity-50"
          >
            {submitting ? 'Booking…' : `Confirm ${formatTime(selected)}`}
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  )
}