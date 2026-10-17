import { useState } from 'react'

export default function Img({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div
        role="img" aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-wave/30 to-silk text-5xl ${className}`}
      >
        🦷
      </div>
    )
  }
  return (
    <img
      src={src} alt={alt} loading="lazy" onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}