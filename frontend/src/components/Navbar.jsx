import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { clinic } from '../config/site'
import { homePath } from '../utils/roles'

// Marketing links, shown to visitors only
const publicLinks = [
  ['Services', '/#services'],
  ['Results', '/#results'],
  ['Doctors', '/#team'],
  ['Reviews', '/#reviews'],
  ['FAQ', '/#faq'],
]

// Links per role, shown after login
const roleLinks = {
  patient: [
    ['Dashboard', '/dashboard'],
    ['Book appointment', '/doctors'],
    ['My appointments', '/my-appointments'],
  ],
  admin: [['Admin dashboard', '/admin/doctors'],
         ['Reception', '/reception'],],
  doctor: [], // added with the doctor dashboard
  staff: [['Reception', '/reception']],  // added with the reception dashboard
}

const linkClass = ({ isActive }) =>
  `hover:text-wave ${isActive ? 'text-wave' : ''}`

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/login')
  }

  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 bg-lagoon/95 text-silk backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* <Link to="/" className="text-lg font-bold text-wave">🦷 {clinic.name}</Link> */}
        <Link to={user ? homePath(user.role) : '/'} className="text-lg font-bold text-wave">🦷 {clinic.name}</Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 text-sm lg:flex">
          {!user &&
            publicLinks.map(([label, href]) => (
              <a key={href} href={href} className="hover:text-wave">{label}</a>
            ))}
          {user &&
            (roleLinks[user.role] || []).map(([label, to]) => (
              <NavLink key={to} to={to} className={linkClass}>{label}</NavLink>
            ))}
        </div>

        <div className="hidden items-center gap-3 text-sm lg:flex">
          {user ? (
            <>
              <span className="text-silk/70">{user.full_name} ({user.role})</span>
              <button onClick={handleLogout} className="rounded border border-silk/40 px-3 py-1 hover:bg-white/10">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-wave">Login</Link>
              <Link to="/register" className="rounded bg-wave px-3 py-1.5 font-medium text-lagoon hover:bg-wave-dark">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="rounded border border-silk/40 px-3 py-1 lg:hidden"
          aria-label="Toggle menu" aria-expanded={open}
        >
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile */}
      {open && (
        <div className="space-y-1 border-t border-silk/10 px-4 pb-4 pt-2 text-sm lg:hidden">
          {!user &&
            publicLinks.map(([label, href]) => (
              <a key={href} href={href} onClick={close} className="block py-2 hover:text-wave">{label}</a>
            ))}
          {user &&
            (roleLinks[user.role] || []).map(([label, to]) => (
              <Link key={to} to={to} onClick={close} className="block py-2 hover:text-wave">{label}</Link>
            ))}

          {user ? (
            <div className="pt-2">
              <p className="mb-2 text-silk/60">{user.full_name} ({user.role})</p>
              <button onClick={handleLogout} className="rounded border border-silk/40 px-3 py-1.5">Logout</button>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link to="/login" onClick={close} className="rounded border border-silk/40 px-3 py-1.5">Login</Link>
              <Link to="/register" onClick={close} className="rounded bg-wave px-3 py-1.5 font-medium text-lagoon">Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}