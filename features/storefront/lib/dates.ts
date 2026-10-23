// Dates on the store are shown in the pharmacy's own time zone with a fixed locale, so the server
// (UTC on Railway) and the browser render the same text.
const DEFAULT_TIMEZONE = 'America/New_York'

function format(value: string | null | undefined, timeZone: string | null | undefined, options: Intl.DateTimeFormatOptions) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone: timeZone || DEFAULT_TIMEZONE }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone: DEFAULT_TIMEZONE }).format(date)
  }
}

export function formatStoreDate(value: string | null | undefined, timeZone?: string | null) {
  return format(value, timeZone, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatStoreDateTime(value: string | null | undefined, timeZone?: string | null) {
  return format(value, timeZone, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}
