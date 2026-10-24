// Dashboard times are shown in the pharmacy's own time zone with a fixed locale, so the server (UTC on
// Railway) and every browser render the same text. Calendar dates with no time of day (expiry, written,
// birth) are stored at UTC midnight and are formatted in UTC so they never shift a day.
const FALLBACK_TIME_ZONE = 'America/New_York'

function format(value: string | null | undefined, timeZone: string | null | undefined, options: Intl.DateTimeFormatOptions) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone: timeZone || FALLBACK_TIME_ZONE }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone: FALLBACK_TIME_ZONE }).format(date)
  }
}

/** "Oct 23, 2026, 8:26 PM EDT" in the store's time zone. */
export function formatDateTime(value: string | null | undefined, timeZone?: string | null) {
  return format(value, timeZone, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

/** "Oct 23, 2026": the store-local day of an event. */
export function formatDay(value: string | null | undefined, timeZone?: string | null) {
  return format(value, timeZone, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "Oct 23, 2026" for a calendar date with no time of day. */
export function formatCalendarDate(value: string | null | undefined) {
  return format(value, 'UTC', { month: 'short', day: 'numeric', year: 'numeric' })
}
