import { useEffect, useRef, useState } from 'react'

export default function Counter({ to, suffix = '', decimals = 0 }) {
  const ref = useRef(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const duration = 1500
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          setValue(to * (1 - Math.pow(1 - p, 3))) // ease-out
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [to])

  const text = value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return <span ref={ref}>{text}{suffix}</span>
}