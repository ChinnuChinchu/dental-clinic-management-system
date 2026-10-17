export default function ErrorBox({ message }) {
  if (!message) return null
  return (
    // key={message} replays the shake each time a new error appears
    <div
      key={message}
      role="alert"
      className="animate-shake rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
    >
      ⚠️ {message}
    </div>
  )
}