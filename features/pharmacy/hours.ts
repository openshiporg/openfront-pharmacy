// Weekly opening hours for a pharmacy location. Stored on PharmacyLocation.hours as
// { store: Day[7], pharmacy: Day[7] }, Sunday first. A Day is { open, close } in 24-hour "HH:MM"
// local to the location's time zone, or null when closed that day.

export type DayHours = { open: string; close: string } | null
export type WeeklyHours = { store: DayHours[]; pharmacy: DayHours[] }

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function normalizeDay(value: unknown): DayHours | undefined {
  if (value === null) return null
  if (!value || typeof value !== 'object') return undefined
  const { open, close } = value as Record<string, unknown>
  if (typeof open !== 'string' || typeof close !== 'string' || !TIME.test(open) || !TIME.test(close) || close <= open) return undefined
  return { open, close }
}

function normalizeWeek(value: unknown): DayHours[] | undefined {
  if (!Array.isArray(value) || value.length !== 7) return undefined
  const days = value.map(normalizeDay)
  return days.some((day) => day === undefined) ? undefined : days as DayHours[]
}

/** Valid weekly hours, or null when the value is missing or malformed. */
export function normalizeWeeklyHours(value: unknown): WeeklyHours | null {
  if (!value || typeof value !== 'object') return null
  const store = normalizeWeek((value as Record<string, unknown>).store)
  const pharmacy = normalizeWeek((value as Record<string, unknown>).pharmacy)
  return store && pharmacy ? { store, pharmacy } : null
}

/** Why a submitted hours value is invalid, or null when it is valid (or empty). */
export function weeklyHoursError(value: unknown) {
  if (value === null || value === undefined) return null
  return normalizeWeeklyHours(value) ? null : 'Hours need an opening and a later closing time (HH:MM) for each open day.'
}

function localNow(timeZone: string, now: Date) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
    const get = (type: string) => parts.find((part) => part.type === type)?.value || ''
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
    return { day, time: `${get('hour')}:${get('minute')}` }
  } catch {
    return null
  }
}

/** Open or closed right now in the location's time zone, and today's index (Sunday = 0). */
export function openState(week: DayHours[], timeZone: string | null | undefined, now = new Date()) {
  const local = localNow(timeZone || 'America/New_York', now)
  if (!local || local.day < 0) return { open: false, today: -1, todayHours: null as DayHours }
  const todayHours = week[local.day]
  return { open: Boolean(todayHours && local.time >= todayHours.open && local.time < todayHours.close), today: local.day, todayHours }
}

export function formatTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  const suffix = hour < 12 ? 'am' : 'pm'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return minute ? `${display}:${String(minute).padStart(2, '0')} ${suffix}` : `${display} ${suffix}`
}

export function formatDay(day: DayHours) {
  return day ? `${formatTime(day.open)} – ${formatTime(day.close)}` : 'Closed'
}

export const DEFAULT_WEEK: DayHours[] = [null, ...Array.from({ length: 5 }, () => ({ open: '09:00', close: '19:00' })), { open: '10:00', close: '16:00' }]
