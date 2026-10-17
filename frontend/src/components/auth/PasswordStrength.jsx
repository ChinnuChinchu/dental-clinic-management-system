const levels = [
  { label: 'Too short', color: 'bg-red-400' },
  { label: 'Weak', color: 'bg-red-400' },
  { label: 'Fair', color: 'bg-amber-400' },
  { label: 'Good', color: 'bg-lime-500' },
  { label: 'Strong', color: 'bg-wave' },
]

export function scorePassword(pw) {
  if (pw.length < 8) return 0
  let score = 1
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++
  return score
}

export default function PasswordStrength({ password }) {
  if (!password) return null
  const score = scorePassword(password)
  const { label, color } = levels[score]

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${n <= score ? color : 'bg-lagoon/10'}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-lagoon/60">Password strength: {label}</p>
    </div>
  )
}