import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../../api/client'
import { btn, btnGhost, card, input } from '../../components/ui'

const emptyForm = {
  full_name: '', email: '', phone: '', password: '',
  specialization: '', qualification: '', consultation_minutes: 30,
}

function DoctorRow({ doctor, onChanged, onError }) {
  const [editing, setEditing] = useState(false)
  const [f, setF] = useState({
    specialization: doctor.specialization,
    qualification: doctor.qualification || '',
    consultation_minutes: doctor.consultation_minutes,
  })

  const patch = async (body) => {
    onError('')
    try {
      await api.patch(`/api/admin/doctors/${doctor.id}`, body)
      setEditing(false)
      onChanged()
    } catch (e) {
      onError(errorMessage(e))
    }
  }

  const save = () =>
    patch({
      specialization: f.specialization,
      qualification: f.qualification || null,
      consultation_minutes: Number(f.consultation_minutes),
    })

  const toggleActive = () => {
    const msg = doctor.is_active
      ? 'Deactivate this doctor? They will disappear from booking and cannot log in. Existing bookings are not cancelled.'
      : 'Reactivate this doctor?'
    if (window.confirm(msg)) patch({ is_active: !doctor.is_active })
  }

  return (
    <div className={`${card} ${doctor.is_active ? '' : 'opacity-60'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {doctor.full_name}
            {!doctor.is_active && <span className="ml-2 text-xs text-red-600">(inactive)</span>}
          </h3>
          <p className="text-sm text-gray-500">{doctor.email}{doctor.phone && ` · ${doctor.phone}`}</p>
          {!editing && (
            <p className="mt-1 text-sm">
              {doctor.specialization}
              {doctor.qualification && ` · ${doctor.qualification}`} · {doctor.consultation_minutes} min
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/doctors/${doctor.id}/schedule`} className={btn}>Schedule</Link>
          <button onClick={() => setEditing(!editing)} className={btnGhost}>
            {editing ? 'Close' : 'Edit'}
          </button>
          <button onClick={toggleActive} className={btnGhost}>
            {doctor.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input className={input} value={f.specialization} placeholder="Specialization"
            onChange={(e) => setF({ ...f, specialization: e.target.value })} />
          <input className={input} value={f.qualification} placeholder="Qualification"
            onChange={(e) => setF({ ...f, qualification: e.target.value })} />
          <input className={input} type="number" min={10} max={120} value={f.consultation_minutes}
            onChange={(e) => setF({ ...f, consultation_minutes: e.target.value })} />
          <button onClick={save} className={`${btn} sm:col-span-3`}>Save changes</button>
        </div>
      )}
    </div>
  )
}

export default function DoctorsAdmin() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/doctors')
      setDoctors(data)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const create = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/api/admin/doctors', {
        ...form,
        phone: form.phone || null,
        qualification: form.qualification || null,
        consultation_minutes: Number(form.consultation_minutes),
      })
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Doctors</h1>
        <button onClick={() => setShowForm(!showForm)} className={btn}>
          {showForm ? 'Cancel' : '+ Add doctor'}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={create} className={`${card} mb-6 grid gap-3 sm:grid-cols-2`}>
          <input required className={input} placeholder="Full name" value={form.full_name} onChange={update('full_name')} />
          <input required type="email" className={input} placeholder="Email (used to log in)" value={form.email} onChange={update('email')} />
          <input className={input} placeholder="Phone (optional)" value={form.phone} onChange={update('phone')} />
          <input required type="password" minLength={8} className={input} placeholder="Temporary password (min 8)" value={form.password} onChange={update('password')} />
          <input required className={input} placeholder="Specialization (e.g. Orthodontist)" value={form.specialization} onChange={update('specialization')} />
          <input className={input} placeholder="Qualification (e.g. BDS, MDS)" value={form.qualification} onChange={update('qualification')} />
          <label className="text-sm sm:col-span-2">
            Minutes per visit
            <input required type="number" min={10} max={120} className={`${input} mt-1`}
              value={form.consultation_minutes} onChange={update('consultation_minutes')} />
          </label>
          <button disabled={saving} className={`${btn} sm:col-span-2`}>
            {saving ? 'Creating…' : 'Create doctor'}
          </button>
          <p className="text-xs text-gray-500 sm:col-span-2">
            After creating, click <b>Schedule</b> to set working hours. Until then the doctor has no bookable slots.
          </p>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : doctors.length === 0 ? (
        <p className="text-gray-500">No doctors yet. Click “Add doctor”.</p>
      ) : (
        <div className="space-y-3">
          {doctors.map((d) => (
            <DoctorRow key={d.id} doctor={d} onChanged={load} onError={setError} />
          ))}
        </div>
      )}
    </div>
  )
}