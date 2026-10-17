import { services } from '../../config/site'
import Reveal from '../Reveal'

export default function Services() {
  return (
    <section id="services" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-lagoon">Our services</h2>
          <p className="mt-2 text-lagoon/60">Complete dental care under one roof</p>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <div className="group h-full rounded-2xl border border-lagoon/10 bg-silk/40 p-6 transition duration-300 hover:-translate-y-1.5 hover:bg-lagoon hover:shadow-xl">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-white text-3xl shadow transition group-hover:bg-wave">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-lagoon transition group-hover:text-wave">{s.title}</h3>
                <p className="mt-2 text-sm text-lagoon/70 transition group-hover:text-silk/80">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}