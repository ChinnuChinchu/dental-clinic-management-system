import { useEffect, useState } from 'react'
import api, { errorMessage } from '../api/client'
import { card } from '../components/ui'
import { formatDate, formatDateTime } from '../utils/date'

export default function MyRecords() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/visits/mine')
      .then((r) => setVisits(r.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-lagoon/60">Loading…</p>

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">My records</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {visits.length === 0 && <p className={`${card} text-center text-lagoon/60`}>No visit records yet.</p>}
      <div className="space-y-4">
        {visits.map((v) => (
          <div key={v.id} className={card}>
            <p className="font-semibold">{formatDateTime(v.start_time)}</p>
            <p className="mb-3 text-sm text-lagoon/60">{v.doctor_name}</p>
            <dl className="space-y-2 text-sm">
              {[['Diagnosis', v.diagnosis], ['Treatment', v.treatment_done], ['Prescription', v.prescription]].map(
                ([k, val]) => val ? (
                  <div key={k}><dt className="font-medium">{k}</dt><dd className="whitespace-pre-wrap text-lagoon/70">{val}</dd></div>
                ) : null,
              )}
            </dl>
            {v.follow_up_date && (
              <p className="mt-3 inline-block rounded-full bg-silk px-3 py-1 text-xs">
                🔔 Next checkup: {formatDate(v.follow_up_date)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}