import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { images } from '../../config/site'
import Img from '../Img'
import Reveal from '../Reveal'

export default function Team() {
  const { user } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/doctors')
      .then((r) => setDoctors(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const canBook = !user || user.role === 'patient'

  return (
    <section id="team" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-lagoon">Meet our doctors</h2>
          <p className="mt-2 text-lagoon/60">Experienced, gentle and friendly</p>
        </Reveal>

        {loading && <p className="text-center text-lagoon/60">Loading…</p>}
        {!loading && doctors.length === 0 && (
          <p className="text-center text-lagoon/60">Our doctors will appear here soon.</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d, i) => (
            <Reveal key={d.id} delay={i * 100}>
              <div className="group overflow-hidden rounded-2xl border border-lagoon/10 bg-white shadow-sm transition hover:shadow-xl">
                <div className="overflow-hidden">
                  <Img
                    src={images.doctors[i % images.doctors.length]}
                    alt={d.full_name}
                    className="aspect-[5/6] w-full transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lagoon">{d.full_name}</h3>
                  <p className="text-sm font-medium text-wave-dark">{d.specialization}</p>
                  {d.qualification && <p className="text-sm text-lagoon/60">{d.qualification}</p>}
                  {canBook && (
                    <Link
                      to={`/book/${d.id}`}
                      className="mt-4 block rounded-full bg-wave py-2 text-center text-sm font-medium text-lagoon transition hover:bg-wave-dark"
                    >
                      Book with {d.full_name.split(' ').slice(0, 2).join(' ')}
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}