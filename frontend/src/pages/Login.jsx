import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import AuthShell from '../components/auth/AuthShell'
import ErrorBox from '../components/auth/ErrorBox'
import Field from '../components/auth/Field'
import SubmitButton from '../components/auth/SubmitButton'
import { homePath } from '../utils/roles'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const u = await login(email, password)
      // navigate(location.state?.from || (u.role === 'admin' ? '/admin/doctors' : '/'), { replace: true })
      navigate(location.state?.from || homePath(u.role), { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your appointments."
      footer={<>New patient? <Link to="/register" className="font-semibold text-wave-dark hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email" icon="✉️" type="email" required autoComplete="email"
          placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password" icon="🔒" type="password" required autoComplete="current-password"
          placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <ErrorBox message={error} />
        <SubmitButton loading={loading} loadingText="Signing in…">Log in</SubmitButton>
      </form>
    </AuthShell>
  )
}