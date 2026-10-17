import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { homePath } from '../utils/roles'

// Wrap pages meant only for visitors (landing, login, register).
export default function GuestOnly({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (user) return <Navigate to={location.state?.from || homePath(user.role)} replace />
  return children
}