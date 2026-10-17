import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function Doctors() {
  const { user } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/doctors')
      .then((r) => setDoctors(r.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500">Loading doctors…</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Our doctors</h1>
      {doctors.length === 0 && <p className="text-gray-500">No doctors available yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((d) => (
          <div key={d.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{d.full_name}</h2>
            <p className="text-sm text-lagoon">{d.specialization}</p>
            {d.qualification && <p className="text-sm text-gray-500">{d.qualification}</p>}
            <p className="mt-1 text-xs text-gray-400">{d.consultation_minutes} min per visit</p>
            {/* <Link
              to={`/book/${d.id}`}
              className="mt-4 inline-block rounded bg-wave px-4 py-2 text-sm font-medium text-lagoon hover:bg-wave-dark"
            >
              Book appointment
            </Link> */}
            {(!user || user.role === 'patient') && (
              <Link to={`/book/${d.id}`} className="mt-4 inline-block rounded bg-wave px-4 py-2 text-sm font-medium text-lagoon hover:bg-wave-dark">
                Book appointment
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}