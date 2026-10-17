import { reasons, stats } from '../../config/site'
import Counter from '../Counter'
import Reveal from '../Reveal'

export default function WhyUs() {
  return (
    <section className="bg-lagoon py-20 text-silk">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold">Why patients choose us</h2>
        </Reveal>

        <div className="mb-14 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-bold text-wave">
                <Counter to={s.value} suffix={s.suffix} decimals={s.decimals} />
              </p>
              <p className="mt-1 text-sm text-silk/70">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r, i) => (
            <Reveal key={r.title} delay={i * 100}>
              <div className="h-full rounded-2xl border border-silk/10 bg-white/5 p-6 transition hover:border-wave hover:bg-white/10">
                <div className="mb-3 text-3xl">{r.icon}</div>
                <h3 className="font-semibold text-wave">{r.title}</h3>
                <p className="mt-2 text-sm text-silk/70">{r.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}