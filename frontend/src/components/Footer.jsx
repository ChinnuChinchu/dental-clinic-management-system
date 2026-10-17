import { clinic } from '../config/site'
import { useAuth } from '../auth/AuthContext'

export default function Footer() {
const { user } = useAuth()
if (user) {
  return (
    <footer className="border-t border-lagoon/10 py-4 text-center text-xs text-lagoon/50">
      {clinic.name} · 📞 {clinic.phone}
    </footer>
  )
}
  return (
    <footer className="bg-lagoon text-silk">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="mb-2 text-lg font-bold text-wave">🦷 {clinic.name}</h3>
          <p className="text-sm text-silk/70">{clinic.tagline}</p>
        </div>
        <div className="text-sm">
          <h4 className="mb-2 font-semibold text-wave">Visit us</h4>
          <p className="text-silk/80">{clinic.address}</p>
          <p className="mt-1 text-silk/80">📞 {clinic.phone}</p>
          <p className="text-silk/80">✉️ {clinic.email}</p>
          <a href={clinic.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-wave hover:underline">
            Open in Google Maps →
          </a>
        </div>
        <div className="text-sm">
          <h4 className="mb-2 font-semibold text-wave">Opening hours</h4>
          {clinic.hours.map(([day, time]) => (
            <p key={day} className="flex justify-between gap-4 text-silk/80">
              <span>{day}</span><span>{time}</span>
            </p>
          ))}
        </div>
      </div>
      <p className="border-t border-silk/10 py-4 text-center text-xs text-silk/50">
        © {new Date().getFullYear()} {clinic.name}. All rights reserved.
      </p>
    </footer>
  )
}