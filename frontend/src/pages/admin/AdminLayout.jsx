import { NavLink, Outlet } from 'react-router-dom'

const tab = ({ isActive }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-lagoon text-silk' : 'hover:bg-lagoon/10'}`

export default function AdminLayout() {
  return (
    <div>
      <div className="mb-6 flex gap-2">
        <NavLink to="/admin/doctors" className={tab}>Doctors</NavLink>
        <NavLink to="/admin/staff" className={tab}>Staff &amp; admins</NavLink>
      </div>
      <Outlet />
    </div>
  )
}