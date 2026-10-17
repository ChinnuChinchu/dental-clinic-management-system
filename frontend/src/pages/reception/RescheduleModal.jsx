import { useState } from 'react'
import api, { errorMessage } from '../../api/client'
import Modal from '../../components/Modal'
import SlotPicker from '../../components/SlotPicker'
import { btn } from '../../components/ui'
import { formatDateTime } from '../../utils/date'

export default function RescheduleModal({ appointment, onClose, onDone }) {
  const [start, setStart] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      await api.patch(`/api/appointments/${appointment.id}/reschedule`, { start_time: start })
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Reschedule appointment" onClose={onClose}>
      <p className="mb-4 text-sm text-lagoon/70">
        {appointment.patient_name} with {appointment.doctor_name}, currently{' '}
        <b>{formatDateTime(appointment.start_time)}</b>
      </p>
      <SlotPicker doctorId={appointment.doctor_id} value={start} onChange={setStart} />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button onClick={submit} disabled={!start || saving} className={`${btn} mt-4 w-full`}>
        {saving ? 'Saving…' : 'Move appointment'}
      </button>
    </Modal>
  )
}