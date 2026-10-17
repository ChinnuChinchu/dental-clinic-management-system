import { Link } from 'react-router-dom'
import { clinic, images } from '../../config/site'
import Img from '../Img'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-silk to-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-wave/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-wave/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-block rounded-full bg-wave/20 px-3 py-1 text-sm font-medium text-lagoon">
            Modern dental care in Thrissur
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-lagoon md:text-6xl">
            Start your <span className="text-wave">healthy smile</span> journey here
          </h1>
          <p className="mt-4 max-w-md text-lg text-lagoon/70">{clinic.tagline}. Book your visit online in under a minute.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/doctors"
              className="rounded-full bg-wave px-7 py-3 font-semibold text-lagoon shadow-lg shadow-wave/30 transition hover:-translate-y-0.5 hover:bg-wave-dark"
            >
              Book appointment
            </Link>
            <a
              href="#services"
              className="rounded-full border border-lagoon/30 px-7 py-3 font-semibold text-lagoon transition hover:bg-lagoon hover:text-silk"
            >
              Our services
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-[2.5rem] border-8 border-white shadow-2xl">
            <Img src={images.hero} alt="Smiling patient" className="aspect-[4/5] w-full" />
          </div>
          <div className="animate-float absolute -left-4 top-10 rounded-2xl bg-white px-4 py-3 shadow-xl">
            <p className="text-xs text-lagoon/60">Patient rating</p>
            <p className="font-bold text-lagoon">⭐ 4.9 / 5</p>
          </div>
          <div
            className="animate-float absolute -right-4 bottom-12 rounded-2xl bg-lagoon px-4 py-3 text-silk shadow-xl"
            style={{ animationDelay: '1.5s' }}
          >
            <p className="text-xs text-silk/60">Next available</p>
            <p className="font-bold">Today ✅</p>
          </div>
        </div>
      </div>
    </section>
  )
}