import { clinic, images } from '../../config/site'
import Img from '../Img'

const perks = [
  ['📅', 'Book in under a minute'],
  ['🔔', 'Reminders so you never miss a checkup'],
  ['📋', 'Your visits and records in one place'],
]

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Left: brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-lagoon lg:block">
        <Img src={images.hero} alt="" className="absolute inset-0 h-full w-full opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-lagoon via-lagoon/70 to-lagoon/30" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-wave/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-wave/20 blur-3xl" />

        <div className="animate-float absolute right-12 top-16 rounded-2xl bg-white px-4 py-3 shadow-xl">
          <p className="text-xs text-lagoon/60">Patient rating</p>
          <p className="font-bold text-lagoon">⭐ 4.9 / 5</p>
        </div>
        <div
          className="animate-float absolute left-12 top-1/2 rounded-2xl bg-wave px-4 py-3 shadow-xl"
          style={{ animationDelay: '2s' }}
        >
          <p className="text-xs text-lagoon/70">Next available</p>
          <p className="font-bold text-lagoon">Today ✅</p>
        </div>

        <div className="relative flex h-full flex-col justify-end p-12 text-silk">
          <p className="mb-2 text-lg font-bold text-wave">🦷 {clinic.name}</p>
          <h2 className="max-w-sm text-3xl font-bold leading-tight">{clinic.tagline}</h2>
          <ul className="mt-6 space-y-3">
            {perks.map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-silk/90">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right: form */}
      <section className="relative flex items-center justify-center bg-silk px-4 py-10">
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-wave/20 blur-3xl lg:hidden" />
        <div className="relative w-full max-w-md animate-[fadein_0.6s_ease-out] rounded-3xl bg-white p-8 shadow-xl shadow-lagoon/10">
          <div className="mb-6">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-wave text-2xl">🦷</div>
            <h1 className="text-2xl font-bold text-lagoon">{title}</h1>
            <p className="mt-1 text-sm text-lagoon/60">{subtitle}</p>
          </div>
          {children}
          <p className="mt-6 text-center text-sm text-lagoon/70">{footer}</p>
        </div>
      </section>
    </div>
  )
}