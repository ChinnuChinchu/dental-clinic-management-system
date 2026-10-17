import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { btn, btnGhost, card, input } from '../../components/ui'

const emptyForm = { full_name: '', email: '', phone: '', password: '', role: 'staff' }

export default function StaffAdmin() {
  const { user: me } = useAuth()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [staff, admins] = await Promise.all([
        api.get('/api/users', { params: { role: 'staff' } }),
        api.get('/api/users', { params: { role: 'admin' } }),
      ])
      setPeople([...admins.data, ...staff.data].sort((a, b) => a.id - b.id))
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
      await api.post('/api/users', { ...form, phone: form.phone || null })
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (person) => {
    const verb = person.is_active ? 'Deactivate' : 'Reactivate'
    if (!window.confirm(`${verb} ${person.full_name}?`)) return
    setError('')
    try {
      await api.patch(`/api/users/${person.id}`, { is_active: !person.is_active })
      load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Staff &amp; admins</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={create} className={`${card} mb-6 grid gap-3 sm:grid-cols-2`}>
        <input required className={input} placeholder="Full name" value={form.full_name} onChange={update('full_name')} />
        <input required type="email" className={input} placeholder="Email" value={form.email} onChange={update('email')} />
        <input className={input} placeholder="Phone (optional)" value={form.phone} onChange={update('phone')} />
        <input required type="password" minLength={8} className={input} placeholder="Temporary password (min 8)" value={form.password} onChange={update('password')} />
        <select className={input} value={form.role} onChange={update('role')}>
          <option value="staff">Staff (reception)</option>
          <option value="admin">Admin</option>
        </select>
        <button disabled={saving} className={btn}>{saving ? 'Creating…' : 'Create account'}</button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {people.map((p) => (
            <div key={p.id} className={`${card} flex items-center justify-between py-3 ${p.is_active ? '' : 'opacity-60'}`}>
              <div>
                <p className="font-medium">
                  {p.full_name}
                  <span className="ml-2 rounded-full bg-silk px-2 py-0.5 text-xs">{p.role}</span>
                  {!p.is_active && <span className="ml-2 text-xs text-red-600">(inactive)</span>}
                </p>
                <p className="text-sm text-gray-500">{p.email}</p>
              </div>
              {p.id !== me.id && (
                <button onClick={() => toggle(p)} className={btnGhost}>
                  {p.is_active ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}