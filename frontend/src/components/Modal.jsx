export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-lagoon/60 p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-lagoon/60 hover:text-lagoon">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}