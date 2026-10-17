import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { errorMessage } from '../../api/client'
import { btn, btnGhost, card, input } from '../../components/ui'
import { addMonths, formatDate, formatDateTime, todayIST } from '../../utils/date'

const empty = { diagnosis: '', treatment_done: '', prescription: '', notes: '', follow_up_date: '' }
const QUICK = [['1 month', 1], ['3 months', 3], ['6 months', 6], ['1 year', 12]]

function Area({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <textarea rows={3} maxLength={4000} className={input} {...props} />
      {hint && <span className="text-xs text-lagoon/50">{hint}</span>}
    </label>
  )
}

export default function DoctorVisit() {
  const { apptId } = useParams()
  const navigate = useNavigate()
  const [appt, setAppt] = useState(null)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data: a } = await api.get(`/api/appointments/${apptId}`)
        const [v, h] = await Promise.all([
          api.get(`/api/visits/appointment/${apptId}`),
          api.get(`/api/visits/patient/${a.patient_id}`),
        ])
        if (cancelled) return
        setAppt(a)
        setHistory(h.data.filter((x) => String(x.appointment_id) !== String(apptId)))
        if (v.data) {
          setForm({
            diagnosis: v.data.diagnosis || '',
            treatment_done: v.data.treatment_done || '',
            prescription: v.data.prescription || '',
            notes: v.data.notes || '',
            follow_up_date: v.data.follow_up_date || '',
          })
        }
      } catch (e) {
        if (!cancelled) setError(errorMessage(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [apptId])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const save = async (markCompleted) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.put(`/api/visits/appointment/${apptId}`, {
        diagnosis: form.diagnosis || null,
        treatment_done: form.treatment_done || null,
        prescription: form.prescription || null,
        notes: form.notes || null,
        follow_up_date: form.follow_up_date || null,
        mark_completed: markCompleted,
      })
      if (markCompleted) navigate('/doctor')
      else setMessage('Saved.')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-lagoon/60">Loading…</p>
  if (!appt) return <p className="text-red-600">{error || 'Appointment not found.'}</p>

  const completed = appt.status === 'completed'

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/doctor" className="text-sm underline">← Back to today</Link>

      <div className={`${card} mb-5 mt-3 bg-lagoon text-silk`}>
        <h1 className="text-xl font-semibold text-wave">{appt.patient_name}</h1>
        <p className="text-sm text-silk/70">
          {appt.patient_phone && `${appt.patient_phone} · `}{formatDateTime(appt.start_time)}
        </p>
        {appt.reason && <p className="mt-1 text-sm">Reason: {appt.reason}</p>}
      </div>

      <div className={`${card} space-y-4`}>
        <Area label="Diagnosis" value={form.diagnosis} onChange={set('diagnosis')} />
        <Area label="Treatment done" value={form.treatment_done} onChange={set('treatment_done')} />
        <Area label="Prescription" value={form.prescription} onChange={set('prescription')}
          hint="Visible to the patient in My records." />
        <Area label="Private notes" value={form.notes} onChange={set('notes')}
          hint="Only clinic staff can see these. Never shown to the patient." />

        <div>
          <span className="mb-1 block text-sm font-medium">Next checkup</span>
          <div className="flex flex-wrap items-center gap-2">
            {QUICK.map(([label, m]) => (
              <button type="button" key={m} className={btnGhost}
                onClick={() => setForm({ ...form, follow_up_date: addMonths(todayIST(), m) })}>
                +{label}
              </button>
            ))}
            <input type="date" value={form.follow_up_date} min={todayIST()} onChange={set('follow_up_date')}
              className={`${input} w-auto`} />
            {form.follow_up_date && (
              <button type="button" className="text-sm text-red-600 hover:underline"
                onClick={() => setForm({ ...form, follow_up_date: '' })}>Clear</button>
            )}
          </div>
          {form.follow_up_date && (
            <p className="mt-1 text-xs text-lagoon/60">
              The patient will be reminded around {formatDate(form.follow_up_date)}.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <div className="flex flex-wrap gap-2">
          {completed ? (
            <button disabled={saving} onClick={() => save(false)} className={btn}>Save changes</button>
          ) : (
            <>
              <button disabled={saving} onClick={() => save(true)} className={btn}>
                {saving ? 'Saving…' : 'Save & complete visit'}
              </button>
              <button disabled={saving} onClick={() => save(false)} className={btnGhost}>Save draft</button>
            </>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-8 font-semibold">Previous visits ({history.length})</h2>
      {history.length === 0 && <p className="text-sm text-lagoon/60">No earlier visits recorded.</p>}
      <div className="space-y-2">
        {history.map((v) => (
          <details key={v.id} className={`${card} py-3`}>
            <summary className="cursor-pointer text-sm font-medium">
              {formatDateTime(v.start_time)} · {v.doctor_name}
              {v.diagnosis && <span className="font-normal text-lagoon/60"> · {v.diagnosis.slice(0, 50)}</span>}
            </summary>
            <dl className="mt-3 space-y-2 text-sm">
              {[['Diagnosis', v.diagnosis], ['Treatment', v.treatment_done],
                ['Prescription', v.prescription], ['Private notes', v.notes]].map(([k, val]) =>
                val ? <div key={k}><dt className="font-medium">{k}</dt><dd className="whitespace-pre-wrap text-lagoon/70">{val}</dd></div> : null)}
              {v.follow_up_date && <p className="text-lagoon/60">Follow-up was set for {formatDate(v.follow_up_date)}</p>}
            </dl>
          </details>
        ))}
      </div>
    </div>
  )
}