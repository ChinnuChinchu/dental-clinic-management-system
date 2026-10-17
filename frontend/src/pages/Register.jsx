import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import AuthShell from '../components/auth/AuthShell'
import ErrorBox from '../components/auth/ErrorBox'
import Field from '../components/auth/Field'
import PasswordStrength from '../components/auth/PasswordStrength'
import SubmitButton from '../components/auth/SubmitButton'
import { homePath } from '../utils/roles'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const mismatch = confirm.length > 0 && confirm !== form.password
  const matches = confirm.length > 0 && confirm === form.password

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/register', { ...form, phone: form.phone || null })
      await login(form.email, form.password)
      // navigate('/')
      navigate('/dashboard')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Book visits and track your dental care."
      footer={<>Already registered? <Link to="/login" className="font-semibold text-wave-dark hover:underline">Log in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Full name" icon="👤" required autoComplete="name"
          placeholder="Your name" value={form.full_name} onChange={update('full_name')}
        />
        <Field
          label="Email" icon="✉️" type="email" required autoComplete="email"
          placeholder="you@example.com" value={form.email} onChange={update('email')}
        />
        <Field
          label="Phone (optional)" icon="📞" type="tel" autoComplete="tel"
          placeholder="+91 98765 43210" value={form.phone} onChange={update('phone')}
        />

        <div>
          <Field
            label="Password" icon="🔒" type="password" required minLength={8} autoComplete="new-password"
            placeholder="At least 8 characters" value={form.password} onChange={update('password')}
          />
          <PasswordStrength password={form.password} />
        </div>

        <Field
          label="Confirm password" icon="🔑" type="password" required autoComplete="new-password"
          placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          hint={
            mismatch ? <span className="text-red-600">Passwords do not match</span>
            : matches ? <span className="text-wave-dark">✓ Passwords match</span>
            : null
          }
        />

        <label className="flex items-start gap-2 text-xs text-lagoon/70">
          <input
            type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-wave"
          />
          I agree to the clinic storing my details to manage my appointments and care.
        </label>

        <ErrorBox message={error} />
        <SubmitButton loading={loading} loadingText="Creating account…" disabled={!agreed || mismatch}>
          Create account
        </SubmitButton>
      </form>
    </AuthShell>
  )
}