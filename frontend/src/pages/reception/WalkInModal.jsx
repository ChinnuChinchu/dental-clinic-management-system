import { useEffect, useState } from 'react'
import api, { errorMessage } from '../../api/client'
import Modal from '../../components/Modal'
import SlotPicker from '../../components/SlotPicker'
import { btn, btnGhost, input } from '../../components/ui'

export default function WalkInModal({ doctors, onClose, onDone }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [patient, setPatient] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newP, setNewP] = useState({ full_name: '', phone: '', email: '' })
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '')
  const [start, setStart] = useState(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Search patients 300ms after the user stops typing
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    const t = setTimeout(() => {
      api.get('/api/users', { params: { role: 'patient', q: query.trim(), limit: 8 } })
        .then((r) => setResults(r.data))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const createPatient = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/api/reception/patients', {
        ...newP, email: newP.email || null,
      })
      setPatient(data)
      setCreating(false)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      await api.post('/api/appointments', {
        doctor_id: Number(doctorId),
        start_time: start,
        reason: reason || null,
        patient_id: patient.id,
      })
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Book for a patient" onClose={onClose}>
      <div className="space-y-5">
        {/* 1. Patient */}
        <section>
          <h3 className="mb-2 text-sm font-semibold">1. Patient</h3>
          {patient ? (
            <div className="flex items-center justify-between rounded-xl bg-silk px-3 py-2 text-sm">
              <span>
                <b>{patient.full_name}</b>
                {patient.phone && ` · ${patient.phone}`}
              </span>
              <button onClick={() => setPatient(null)} className="text-wave-dark hover:underline">Change</button>
            </div>
          ) : creating ? (
            <form onSubmit={createPatient} className="space-y-2">
              <input required className={input} placeholder="Full name" value={newP.full_name}
                onChange={(e) => setNewP({ ...newP, full_name: e.target.value })} />
              <input required className={input} placeholder="Phone" value={newP.phone}
                onChange={(e) => setNewP({ ...newP, phone: e.target.value })} />
              <input type="email" className={input} placeholder="Email (optional)" value={newP.email}
                onChange={(e) => setNewP({ ...newP, email: e.target.value })} />
              <div className="flex gap-2">
                <button className={btn}>Save patient</button>
                <button type="button" onClick={() => setCreating(false)} className={btnGhost}>Back to search</button>
              </div>
            </form>
          ) : (
            <>
              <input className={input} placeholder="Search by name, phone or email" value={query}
                onChange={(e) => setQuery(e.target.value)} />
              {results.length > 0 && (
                <ul className="mt-2 divide-y rounded-xl border border-lagoon/10">
                  {results.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => setPatient(p)} className="w-full px-3 py-2 text-left text-sm hover:bg-silk/50">
                        <b>{p.full_name}</b>
                        <span className="text-lagoon/60"> · {p.phone || p.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query.trim().length >= 2 && results.length === 0 && (
                <p className="mt-2 text-sm text-lagoon/60">No match found.</p>
              )}
              <button onClick={() => setCreating(true)} className="mt-2 text-sm text-wave-dark hover:underline">
                + New patient (no account yet)
              </button>
            </>
          )}
        </section>

        {/* 2. Doctor and time */}
        {patient && (
          <section>
            <h3 className="mb-2 text-sm font-semibold">2. Doctor and time</h3>
            <select className={`${input} mb-3`} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name} · {d.specialization}</option>
              ))}
            </select>
            <SlotPicker doctorId={doctorId} value={start} onChange={setStart} />
            <input className={`${input} mt-3`} placeholder="Reason (optional)" maxLength={500}
              value={reason} onChange={(e) => setReason(e.target.value)} />
          </section>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {patient && (
          <button onClick={submit} disabled={!start || saving} className={`${btn} w-full`}>
            {saving ? 'Booking…' : 'Confirm booking'}
          </button>
        )}
      </div>
    </Modal>
  )
}