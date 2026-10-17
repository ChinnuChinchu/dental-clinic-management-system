import { useState } from 'react'
import { faqs } from '../../config/site'
import Reveal from '../Reveal'

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-2xl px-4">
        <Reveal className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-lagoon">Frequently asked questions</h2>
        </Reveal>
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="overflow-hidden rounded-xl border border-lagoon/10">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-lagoon hover:bg-silk/50"
                >
                  {f.q}
                  <span className={`ml-4 text-wave transition-transform ${isOpen ? 'rotate-45' : ''}`}>＋</span>
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-lagoon/70">{f.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}