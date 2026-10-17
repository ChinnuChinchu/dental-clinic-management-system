const TZ = 'Asia/Kolkata' // clinic timezone, independent of the visitor's device

export const todayIST = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: TZ }) // YYYY-MM-DD

export const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true,
  })

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    timeZone: TZ, dateStyle: 'medium', timeStyle: 'short',
  })

export const formatDay = (isoDate) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  })