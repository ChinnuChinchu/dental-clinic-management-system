import { useState } from 'react'

export default function Field({ label, icon, type = 'text', hint, ...props }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-lagoon">{label}</span>
      <div className="group relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base opacity-50 transition group-focus-within:opacity-100">
          {icon}
        </span>
        <input
          {...props}
          type={isPassword && show ? 'text' : type}
          className="w-full rounded-xl border border-lagoon/15 bg-silk/30 py-3 pl-11 pr-11 transition hover:border-wave/60 focus:bg-white"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-sm opacity-60 hover:opacity-100"
          >
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {hint && <span className="mt-1 block text-xs">{hint}</span>}
    </label>
  )
}