import { WEEKDAYS, formatDay, openState, type DayHours, type WeeklyHours } from '@/features/pharmacy/hours'
import { cn } from '@/lib/utils'
import { Dot } from './rx-ui'

/** "Open now" state for a week of hours in the location's time zone. */
export function OpenNow({ week, timezone, label }: { week: DayHours[]; timezone?: string | null; label?: string }) {
  const state = openState(week, timezone)
  const text = state.open ? `Open until ${formatDay(state.todayHours).split(' – ')[1]}` : state.todayHours ? `Closed · today ${formatDay(state.todayHours)}` : 'Closed today'
  return <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap text-sm text-muted-foreground"><Dot tone={state.open ? 'ok' : 'muted'} />{label ? `${label} · ` : ''}{text}</span>
}

/** Weekly store and pharmacy counter hours, today highlighted. */
export function LocationHours({ hours, timezone, className }: { hours: WeeklyHours; timezone?: string | null; className?: string }) {
  const today = openState(hours.store, timezone).today
  return <table className={cn('w-full text-sm', className)}>
    <caption className="sr-only">Opening hours</caption>
    <thead><tr className="rx-eyebrow text-left"><th scope="col" className="pb-1.5 font-normal">Day</th><th scope="col" className="pb-1.5 font-normal">Store</th><th scope="col" className="pb-1.5 font-normal">Pharmacy</th></tr></thead>
    <tbody>
      {WEEKDAYS.map((day, index) => <tr key={day} aria-current={index === today ? 'date' : undefined} className={cn('border-t border-[var(--rx-rule)]', index === today && 'font-semibold')}>
        <th scope="row" className="py-1.5 pr-3 text-left font-[inherit]">{day.slice(0, 3)}</th>
        <td className="rx-num py-1.5 pr-3">{formatDay(hours.store[index])}</td>
        <td className="rx-num py-1.5">{formatDay(hours.pharmacy[index])}</td>
      </tr>)}
    </tbody>
  </table>
}
