// Prescription written/expiry dates and lot expiration dates are calendar dates. They are stored at a fixed UTC
// time of that day (midnight for prescriptions, noon for lots) and displayed in UTC so they never shift. They
// mean "through that day at the pharmacy": a lot expiring 2027-09-20 may be sold all of Sept 20 in the store's
// time zone, and a prescription expiring May 5 can be filled until the store closes that evening.
export const FALLBACK_PHARMACY_TIME_ZONE = 'America/New_York'

export function validTimeZone(timeZone: unknown): string {
  if (typeof timeZone === 'string' && timeZone) {
    try { new Intl.DateTimeFormat('en-US', { timeZone }); return timeZone } catch { /* fall through */ }
  }
  return FALLBACK_PHARMACY_TIME_ZONE
}

/** The calendar day (YYYY-MM-DD) of a stored date-only value. */
export function storedCalendarDay(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

/** Today's calendar day (YYYY-MM-DD) at the pharmacy. */
export function pharmacyToday(timeZone: unknown, now: number | Date = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: validTimeZone(timeZone), year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(now))
  const get = (type: string) => parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** True while the calendar date has not yet passed at the pharmacy (usable through that local day). */
export function calendarDateStillValid(value: string | Date | null | undefined, timeZone: unknown, now: number | Date = Date.now()) {
  const day = storedCalendarDay(value)
  return day !== null && day >= pharmacyToday(timeZone, now)
}

/** True when the calendar date is today or earlier at the pharmacy (e.g. a prescription written date). */
export function calendarDateNotFuture(value: string | Date | null | undefined, timeZone: unknown, now: number | Date = Date.now()) {
  const day = storedCalendarDay(value)
  return day !== null && day <= pharmacyToday(timeZone, now)
}

function zoneOffsetMs(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(instant))
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - Math.floor(instant / 1000) * 1000
}

/** The instant a calendar date ends at the pharmacy (start of the next local day). */
export function endOfPharmacyDay(value: string | Date | null | undefined, timeZone: unknown): Date | null {
  const day = storedCalendarDay(value)
  if (!day) return null
  const zone = validTimeZone(timeZone)
  const [year, month, date] = day.split('-').map(Number)
  const localMidnight = Date.UTC(year, month - 1, date + 1)
  let instant = localMidnight - zoneOffsetMs(localMidnight, zone)
  instant = localMidnight - zoneOffsetMs(instant, zone)
  return new Date(instant)
}

/** Strict YYYY-MM-DD (or an ISO instant, whose UTC day is used), rejecting impossible dates like 2027-02-30. */
export function parseCalendarDateInput(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const day = /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : storedCalendarDay(value.trim())
  if (!day) return null
  const [year, month, date] = day.split('-').map(Number)
  const check = new Date(Date.UTC(year, month - 1, date))
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== date) return null
  return day
}

/** Normalised lot number used for uniqueness: trimmed, inner whitespace collapsed, upper-case. */
export function lotNumberKey(lotNumber: string) {
  return lotNumber.trim().replace(/\s+/g, ' ').toUpperCase()
}
