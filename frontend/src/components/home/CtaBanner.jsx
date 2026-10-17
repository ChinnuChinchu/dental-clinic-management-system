import { Link } from 'react-router-dom'
import { clinic, images } from '../../config/site'
import Img from '../Img'
import Reveal from '../Reveal'

export default function CtaBanner() {
  return (
    <section className="bg-silk px-4 pb-20">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-lagoon">
          <Img src={images.cta} alt="" className="absolute inset-0 h-full w-full opacity-20" />
          <div className="relative px-6 py-14 text-center text-silk">
            <h2 className="text-3xl font-bold md:text-4xl">Ready for a healthier smile?</h2>
            <p className="mx-auto mt-3 max-w-md text-silk/70">
              Book your appointment online, or call us on {clinic.phone}.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/doctors" className="rounded-full bg-wave px-8 py-3 font-semibold text-lagoon transition hover:-translate-y-0.5 hover:bg-wave-dark">
                Book now
              </Link>
              <a href={`tel:${clinic.phone.replace(/\s/g, '')}`} className="rounded-full border border-silk/40 px-8 py-3 font-semibold transition hover:bg-white/10">
                📞 Call the clinic
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}