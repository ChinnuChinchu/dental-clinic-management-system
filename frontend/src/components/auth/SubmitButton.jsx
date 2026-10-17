export default function SubmitButton({ loading, children, loadingText, disabled }) {
  return (
    <button
      disabled={loading || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-wave py-3 font-semibold text-lagoon shadow-lg shadow-wave/30 transition hover:-translate-y-0.5 hover:bg-wave-dark disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-lagoon border-t-transparent" />
      )}
      {loading ? loadingText : children}
    </button>
  )
}