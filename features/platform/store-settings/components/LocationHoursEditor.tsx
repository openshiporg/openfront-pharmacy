'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Callout, Pill, RxButton as Button, TitleLine, Track } from '@/features/platform/components/rx-ui'
import { DEFAULT_WEEK, WEEKDAYS, type DayHours, type WeeklyHours } from '@/features/pharmacy/hours'
import { updateLocationHours, type StoreLocationHours } from '../actions'

type Counter = 'store' | 'pharmacy'

function DayRow({ day, value, onChange }: { day: string; value: DayHours; onChange: (next: DayHours) => void }) {
  return <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5 py-1.5 sm:grid-cols-[6rem_auto_minmax(0,1fr)]">
    <span className="text-sm font-medium"><span className="sm:hidden">{day.slice(0, 3)}</span><span className="hidden sm:inline">{day}</span></span>
    <Track label={`${day} open or closed`}>
      <Pill active={Boolean(value)} onClick={() => onChange(value || { open: '09:00', close: '18:00' })}>Open</Pill>
      <Pill active={!value} onClick={() => onChange(null)}>Closed</Pill>
    </Track>
    {value
      ? <div className="col-span-2 flex min-w-0 items-center gap-1.5 sm:col-span-1">
        <Input type="time" aria-label={`${day} opens`} value={value.open} onChange={(event) => onChange({ ...value, open: event.target.value })} className="h-9 min-w-0 rounded-full font-mono tabular-nums" />
        <span aria-hidden="true" className="text-muted-foreground">–</span>
        <Input type="time" aria-label={`${day} closes`} value={value.close} onChange={(event) => onChange({ ...value, close: event.target.value })} className="h-9 min-w-0 rounded-full font-mono tabular-nums" />
      </div>
      : <span className="col-span-2 text-sm text-muted-foreground sm:col-span-1">Closed</span>}
  </div>
}

export function LocationHoursEditor({ location }: { location: StoreLocationHours }) {
  const [timezone, setTimezone] = useState(location.timezone)
  const [hours, setHours] = useState<WeeklyHours>(location.hours || { store: DEFAULT_WEEK, pharmacy: DEFAULT_WEEK })
  const [counter, setCounter] = useState<Counter>('pharmacy')
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState('')
  const [pending, startTransition] = useTransition()

  function setDay(index: number, value: DayHours) {
    setHours((current) => ({ ...current, [counter]: current[counter].map((entry, position) => position === index ? value : entry) }))
  }

  function save() {
    setError('')
    setSavedAt('')
    startTransition(async () => {
      const result = await updateLocationHours(location.id, { timezone, hours })
      if (!result.success) return setError(result.error)
      toast.success(`Hours saved for ${location.name}`)
      setSavedAt(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
    })
  }

  return <section className="space-y-4 rounded-xl bg-background p-4 ring-1 ring-border sm:p-5">
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <TitleLine as="h2" title={location.name} titleClassName="text-sm" tone={location.hours ? 'ok' : 'warn'} state={location.hours ? 'Hours set' : 'No hours yet'} />
      <Track label="Hours for">
        <Pill active={counter === 'pharmacy'} onClick={() => setCounter('pharmacy')}>Pharmacy counter</Pill>
        <Pill active={counter === 'store'} onClick={() => setCounter('store')}>Store</Pill>
      </Track>
    </div>
    <div className="divide-y divide-dashed">{WEEKDAYS.map((day, index) => <DayRow key={day} day={day} value={hours[counter][index]} onChange={(next) => setDay(index, next)} />)}</div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1.5 text-sm font-medium">Time zone<Input value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={64} className="h-9 w-56 rounded-full font-mono" /></label>
      <Button onClick={save} disabled={pending}>{pending ? 'Saving…' : 'Save hours'}</Button>
      {savedAt && <p role="status" className="pb-2 text-sm text-muted-foreground">Saved {savedAt}</p>}
    </div>
    {error && <Callout tone="danger">{error}</Callout>}
  </section>
}
