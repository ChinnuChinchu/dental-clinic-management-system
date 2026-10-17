import { useEffect, useState } from 'react'
import { testimonials } from '../../config/site'
import Reveal from '../Reveal'

export default function Testimonials() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 5000)
    return () => clearInterval(id)
  }, [paused])

  const t = testimonials[index]

  return (
    <section id="reviews" className="scroll-mt-20 bg-silk py-20">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <Reveal>
          <h2 className="mb-10 text-3xl font-bold text-lagoon">What our patients say</h2>
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="rounded-3xl bg-white p-8 shadow-lg"
          >
            <div key={index} className="animate-[fadein_0.6s_ease-out]">
              <p className="text-xl text-wave">{'★'.repeat(t.rating)}</p>
              <p className="mt-4 text-lg text-lagoon/80">“{t.text}”</p>
              <p className="mt-4 font-semibold text-lagoon">{t.name}</p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i} onClick={() => setIndex(i)} aria-label={`Show review ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all ${i === index ? 'w-8 bg-wave' : 'w-2.5 bg-lagoon/20'}`}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}