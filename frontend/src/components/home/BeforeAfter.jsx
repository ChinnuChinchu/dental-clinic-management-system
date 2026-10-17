import { useState } from 'react'
import { images } from '../../config/site'
import Img from '../Img'
import Reveal from '../Reveal'

export default function BeforeAfter() {
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState(50)
  const item = images.results[active]

  const choose = (i) => {
    setActive(i)
    setPos(50)
  }

  return (
    <section id="results" className="scroll-mt-20 bg-silk py-20">
      <div className="mx-auto max-w-3xl px-4">
        <Reveal className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-lagoon">Results that speak for themselves</h2>
          <p className="mt-2 text-lagoon/60">Drag the slider to compare before and after</p>
        </Reveal>

        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {images.results.map((r, i) => (
            <button
              key={r.label} onClick={() => choose(i)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                i === active ? 'bg-lagoon text-silk' : 'bg-white text-lagoon hover:bg-wave/30'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="relative aspect-[4/3] select-none overflow-hidden rounded-3xl border-8 border-white shadow-2xl">
          <Img src={item.after} alt={`${item.label} after`} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <Img src={item.before} alt={`${item.label} before`} className="h-full w-full" />
          </div>

          <span className="absolute left-3 top-3 rounded-full bg-lagoon/80 px-3 py-1 text-xs text-silk">Before</span>
          <span className="absolute right-3 top-3 rounded-full bg-wave px-3 py-1 text-xs font-medium text-lagoon">After</span>

          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${pos}%` }}>
            <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-wave font-bold text-lagoon shadow-lg">
              ↔
            </span>
          </div>

          <input
            type="range" min={0} max={100} value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Compare before and after"
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      </div>
    </section>
  )
}